import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { convertFile } from '@/lib/converter';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const targetFormat = formData.get('targetFormat') as string | null;

    if (!file || !targetFormat) {
      return NextResponse.json(
        { error: 'File and targetFormat are required' },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const originalExtension = path.extname(originalName).slice(1).toLowerCase();

    if (!originalExtension) {
        return NextResponse.json(
            { error: 'File has no extension' },
            { status: 400 }
        );
    }

    // Create unique filename
    const fileId = crypto.randomUUID();
    const inputFileName = `${fileId}.${originalExtension}`;
    const outputFileName = `${fileId}.${targetFormat.toLowerCase()}`;

    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const inputPath = path.join(uploadsDir, inputFileName);
    const outputPath = path.join(uploadsDir, outputFileName);

    // Ensure uploads dir exists
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Write input file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    // Save initial record
    const conversion = await prisma.conversion.create({
      data: {
        id: fileId,
        originalName,
        convertedName: null, // Will be updated
        originalType: originalExtension,
        targetType: targetFormat,
        status: 'pending',
        filePath: null, // Will be updated
      },
    });

    // Convert
    try {
      await convertFile(inputPath, outputPath, targetFormat, originalExtension);

      // Update record
      const conversionRecord = await prisma.conversion.update({
        where: { id: fileId },
        data: {
          status: 'completed',
          convertedName: outputFileName,
          filePath: `/uploads/${outputFileName}`,
        },
      });

      return NextResponse.json({
        success: true,
        downloadUrl: `/uploads/${outputFileName}`,
        conversion: conversionRecord,
      });

    } catch (error: any) {
      console.error('Conversion logic error:', error);
      await prisma.conversion.update({
        where: { id: fileId },
        data: { status: 'failed' },
      });
      return NextResponse.json(
        { error: 'Conversion failed', details: error.message || String(error) },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message || String(error) },
      { status: 500 }
    );
  }
}

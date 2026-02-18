import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import yaml from 'js-yaml';
import Papa from 'papaparse';
import sharp from 'sharp';

export async function convertFile(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  originalFormat: string
): Promise<void> {
  const fileContent = await fs.readFile(inputPath);

  // Normalize formats to lowercase
  targetFormat = targetFormat.toLowerCase().replace('.', '');
  originalFormat = originalFormat.toLowerCase().replace('.', '');

  if (originalFormat === 'md' && targetFormat === 'html') {
    const html = await marked.parse(fileContent.toString());
    await fs.writeFile(outputPath, html);
    return;
  }

  if (originalFormat === 'json' && targetFormat === 'yaml') {
    const json = JSON.parse(fileContent.toString());
    const yamlStr = yaml.dump(json);
    await fs.writeFile(outputPath, yamlStr);
    return;
  }

  if ((originalFormat === 'yaml' || originalFormat === 'yml') && targetFormat === 'json') {
    const json = yaml.load(fileContent.toString());
    await fs.writeFile(outputPath, JSON.stringify(json, null, 2));
    return;
  }

  if (originalFormat === 'csv' && targetFormat === 'json') {
    const csvData = fileContent.toString();
    const result = Papa.parse(csvData, { header: true });
    await fs.writeFile(outputPath, JSON.stringify(result.data, null, 2));
    return;
  }

  const imageFormats = ['png', 'jpg', 'jpeg', 'webp'];
  if (imageFormats.includes(originalFormat) && imageFormats.includes(targetFormat)) {
    try {
      // safe cast to any or check specifically if targetFormat is valid key
      await sharp(inputPath).toFormat(targetFormat as any).toFile(outputPath);
      return;
    } catch (error) {
       console.error("Image conversion error:", error);
       throw new Error(`Image conversion failed: ${error}`);
    }
  }

  throw new Error(`Unsupported conversion: ${originalFormat} to ${targetFormat}`);
}

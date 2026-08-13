import { Jimp } from 'jimp';
import fs from 'fs';

async function processLogos() {
  // 1. logo.png (hacha con fondo negro) -> iconos PWA para instalación
  const logoWithBgBuffer = fs.readFileSync('src/assets/logo.png');
  const logoWithBg = await Jimp.read(logoWithBgBuffer);

  const icon192 = logoWithBg.clone().resize({ w: 192, h: 192 });
  await icon192.write('public/icon-192.png');

  const icon512 = logoWithBg.clone().resize({ w: 512, h: 512 });
  await icon512.write('public/icon-512.png');

  // Maskable: hacha centrada en ~66% del canvas con fondo oscuro #09070F
  const maskable = new Jimp({ width: 512, height: 512, color: 0x09070FFF });
  const axe340 = logoWithBg.clone().resize({ w: 340, h: 340 });
  maskable.composite(axe340, 86, 86);
  await maskable.write('public/icon-512-maskable.png');

  // 2. logo-removebg.png (hacha sin fondo) -> favicon pequeño PNG
  const logoNoBgBuffer = fs.readFileSync('src/assets/logo-removebg.png');
  const logoNoBg = await Jimp.read(logoNoBgBuffer);
  const favicon = logoNoBg.clone().resize({ w: 64, h: 64 });
  await favicon.write('public/favicon.png');

  console.log('Icons generated successfully.');
}

processLogos().catch(console.error);

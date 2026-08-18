import { Jimp } from 'jimp';

async function fixIcon() {
  try {
    const icon = await Jimp.read('./public/icon-512.png');
    
    // Create a new image with a solid dark background color (#09070F in hex is 0x09070FFF)
    const bg = new Jimp({ width: 512, height: 512, color: 0x09070FFF });
    
    // Composite the original icon over the solid background
    bg.composite(icon, 0, 0);
    
    // Save as apple-touch-icon.png
    bg.write('./public/apple-touch-icon.png');
    console.log('apple-touch-icon.png created successfully!');
  } catch (error) {
    console.error('Error creating icon:', error);
  }
}

fixIcon();

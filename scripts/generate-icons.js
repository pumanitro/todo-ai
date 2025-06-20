const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to generate a simple icon
function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1976d2';
  ctx.fillRect(0, 0, size, size);

  // Add rounded corners
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  const radius = size / 8;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';

  // Draw "T" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Check if canvas is available
try {
  // Generate icons
  generateIcon(192, 'icon-192.png');
  generateIcon(512, 'icon-512.png');
  console.log('Icons generated successfully!');
} catch (error) {
  console.log('Canvas not available. Please install canvas package:');
  console.log('npm install canvas');
  console.log('');
  console.log('Or create icons manually using any image editor:');
  console.log('- icon-192.png (192x192 pixels)');
  console.log('- icon-512.png (512x512 pixels)');
  console.log('- Use your app logo/icon');
  console.log('- Recommended: Material Design icon guidelines');
} 
// Simple script to update preview, render canvas, download PNG and print.
// Works without external libs.

function el(id){ return document.getElementById(id); }

function updatePreview(){
  // Grab values
  const amt = el('amount').value || '0';
  const recipient = el('recipient').value || '';
  const from = el('from').value || '';
  const message = el('message').value || '';

  // Update preview DOM
  el('pvAmount').textContent = Number(amt).toLocaleString();
  el('pvRecipient').textContent = recipient;
  el('pvFrom').textContent = from;
  el('pvMessage').textContent = message;
}

// create canvas snapshot of the preview element and prompt download
async function downloadCard(){
  const node = el('cardPreview');
  // compute size — use getBoundingClientRect to keep DPI reasonable
  const rect = node.getBoundingClientRect();
  const scale = 2; // increase for sharper image
  const width = Math.round(rect.width * scale);
  const height = Math.round(rect.height * scale);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  // white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,width,height);

  // Draw a simplified rendering by serializing computed styles and drawing text/images.
  // For fidelity, we'll draw background and then use foreignObject approach by drawing the node via SVG.

 const data = `
<svg xmlns="https://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      ${new XMLSerializer().serializeToString(node)}
    </foreignObject>
  </svg>`;

  // Create image from svg
  const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);
    // draw scaled
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const png = canvas.toDataURL('image/png');

    // trigger download
    const a = document.createElement('a');
    a.href = png;
    a.download = `gift-card-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err){
    alert('Could not create image from preview. Try a different browser or use Print.');
    console.error(err);
  }
}

function loadImage(src){
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    // needed for cross-origin inline SVG
    i.crossOrigin = 'anonymous';
    i.src = src;
  });
}

function printCard(){
  // Open a new window with just the card for printing
  const node = el('cardPreview');
  const html = `
  <html><head><title>Print Gift Card</title>
  <style>
    body{margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background:#f6f8fa;}
    .wrap{ padding:12px; }
  </style>
  </head><body><div class="wrap">${node.outerHTML}</div>
  <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 300);}</script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=900,height=700');
  if(!w){ alert('Popup blocked. Allow popups or use the Download button.'); return; }
  w.document.write(html);
  w.document.close();
}

// wire up buttons
document.addEventListener('DOMContentLoaded', () => {
  updatePreview();
  document.getElementById('downloadBtn').addEventListener('click', downloadCard);
  document.getElementById('printBtn').addEventListener('click', printCard);
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('cardForm').reset();
    // set defaults again
    document.getElementById('amount').value = 1500;
    document.getElementById('recipient').value = 'Amar';
    document.getElementById('from').value = 'Friend';
    document.getElementById('message').value = 'Happy birthday! Enjoy a treat :)';
    updatePreview();
  });
});


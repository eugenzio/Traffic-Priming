/**
 * Utility to capture and download canvas as PNG
 */

export function downloadCanvasSnapshot(canvas: HTMLCanvasElement | null, filename: string = 'scene-snapshot.png') {
  if (!canvas) {
    console.warn('Cannot download snapshot: canvas not found');
    return;
  }

  try {
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error downloading canvas snapshot:', error);
  }
}

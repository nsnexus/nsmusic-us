function wrapText(context, text, x, y, width, lineHeight, maxLines = 8) {
  const lines = [];
  let line = '';
  for (const char of text.replace(/\s+/g, ' ')) {
    if (context.measureText(line + char).width > width && line) {
      lines.push(line.trim()); line = '';
    }
    line += char;
  }
  if (line) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value + (index === maxLines - 1 && lines.length > maxLines ? '…' : ''), x, y + index * lineHeight));
}

export async function renderGiftVideo({ photos, audioUrl, retrospective, title, onProgress, signal }) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || !window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error('Video creation needs a browser with recording support. Try the latest Chrome or Edge.');
  }
  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    .find((mime) => MediaRecorder.isTypeSupported(mime));
  if (!mimeType) throw new Error('This browser cannot export video. Try the latest Chrome or Edge.');
  const audio = new AudioContext();
  const objectUrls = [];
  let source, stream, animation, recorder;
  try {
    // Resume on the originating button click, before any network request.
    await audio.resume();
    if (audio.state !== 'running') throw new Error('Your browser blocked audio. Click Create video again.');
    const response = await fetch(audioUrl, { signal });
    if (!response.ok) throw new Error('Your song could not be loaded. Refresh this page and try again.');
    const buffer = await audio.decodeAudioData(await response.arrayBuffer());
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) throw new Error('Your song could not be decoded.');
    const images = await Promise.all(photos.map(async (photo) => {
      const result = await fetch(photo.url, { signal });
      if (!result.ok) throw new Error('A photo could not be loaded. Upload it again.');
      const url = URL.createObjectURL(await result.blob());
      objectUrls.push(url);
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    }));
    signal?.throwIfAborted();
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not open the video canvas.');
    const destination = audio.createMediaStreamDestination();
    source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(destination);
    stream = canvas.captureStream(24);
    for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);
    // Leave room for audio and container overhead under the upload's 50 MB cap.
    const videoBitsPerSecond = Math.max(180000, Math.min(1800000, Math.floor(43 * 1024 * 1024 * 8 / buffer.duration) - 128000));
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond, audioBitsPerSecond: 128000 });
    const chunks = [];
    const started = audio.currentTime;
    function draw() {
      const elapsed = audio.currentTime - started;
      const index = Math.min(photos.length - 1, Math.floor(elapsed / buffer.duration * photos.length));
      const img = images[index];
      context.fillStyle = '#f7f2e9';
      context.fillRect(0, 0, 1280, 720);
      const maxWidth = retrospective ? 760 : 1280;
      const ratio = Math.min(maxWidth / img.width, 720 / img.height);
      const width = img.width * ratio, height = img.height * ratio;
      context.drawImage(img, (maxWidth - width) / 2, (720 - height) / 2, width, height);
      if (retrospective) {
        context.fillStyle = '#b15b3d';
        context.font = '18px sans-serif';
        context.fillText(`MEMORY ${String(index + 1).padStart(2, '0')}`, 810, 100);
        context.fillStyle = '#292a24';
        context.font = '32px Georgia';
        wrapText(context, title, 810, 170, 410, 40, 3);
        context.font = '19px sans-serif';
        context.fillText(photos[index].date || 'A moment to remember', 810, 300);
        context.font = '24px Georgia';
        wrapText(context, photos[index].caption || '', 810, 365, 400, 34);
        context.font = '16px sans-serif';
        context.fillText('NSMusic · Your story, in a song', 810, 660);
      } else {
        context.fillStyle = 'rgba(20,20,18,.62)';
        context.fillRect(0, 620, 1280, 100);
        context.fillStyle = '#ffffff';
        context.font = '26px Georgia';
        context.fillText(title.slice(0, 70), 40, 680);
      }
      onProgress?.(Math.min(99, Math.round(elapsed / buffer.duration * 100)));
      animation = requestAnimationFrame(draw);
    }
    draw();
    return await new Promise((resolve, reject) => {
      function abort() {
        if (recorder.state !== 'inactive') recorder.stop();
        reject(new DOMException('Video creation cancelled.', 'AbortError'));
      }
      signal?.addEventListener('abort', abort, { once: true });
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { signal?.removeEventListener('abort', abort); reject(new Error('Video recording failed. Please try again.')); };
      recorder.onstop = () => {
        signal?.removeEventListener('abort', abort);
        if (signal?.aborted) return;
        const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
        if (!blob.size) reject(new Error('The video was empty. Please try again.'));
        else if (blob.size > 50 * 1024 * 1024) reject(new Error('This browser created a video over 50 MB. Try Chrome or Edge to export a smaller file.'));
        else { onProgress?.(100); resolve(blob); }
      };
      source.onended = () => { if (recorder.state !== 'inactive') recorder.stop(); };
      recorder.start(1000);
      source.start();
    });
  } finally {
    cancelAnimationFrame(animation);
    if (recorder?.state !== 'inactive') { try { recorder?.stop(); } catch {} }
    try { source?.stop(); } catch {}
    stream?.getTracks().forEach((track) => track.stop());
    await audio.close().catch(() => {});
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }
}

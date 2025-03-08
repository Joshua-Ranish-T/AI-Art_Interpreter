import React from 'react';

function YouTubeEmbed({ videoId }) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div style={{ margin: '10px' }}>
      <iframe
        width="560"
        height="315"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
}

export default YouTubeEmbed;

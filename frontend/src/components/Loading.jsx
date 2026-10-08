import React from 'react';

const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="loading-container">
      <div className="loading-spinner" aria-label="Loading indicator" />
      <p className="loading-text">{message}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="loading-fullscreen">{content}</div>;
  }

  return content;
};

export default Loading;

'use client';

import ReactGithubCalendar from 'react-github-calendar';

const GithubCalendar = () => {
  return (
    <ReactGithubCalendar
      username="beigeyoon"
      year={2025}
      theme={{
        light: ['#f0f0f0', '#d0d0d0', '#b0b0b0', '#888888', '#000000']
      }}
      style={{
        margin: 'auto',
        display: 'block',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    />
  );
};

export default GithubCalendar;

const getApiBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window === 'undefined' || !window.location) {
    return '';
  }

  const { protocol, hostname, origin, port } = window.location;
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0';

  // In local frontend dev, React usually runs on 3000 while the API runs on 5000.
  if (isLocalhost && port !== '5000') {
    return `${protocol}//${hostname}:5000`;
  }

  return origin;
};

const base = getApiBaseUrl();

export default base;

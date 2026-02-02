const ALLOWED_DOMAINS = [
  "charitableimpact.com",
  "my.charitableimpact.com"
];

export function validateDomain(url) {
  return ALLOWED_DOMAINS.some(d => url.includes(d));
}


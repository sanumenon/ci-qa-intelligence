const ALLOWED_DOMAINS = [
  "charitableimpact.com",
  "my.charitableimpact.com",
  "my.qa.charitableimpact.com",
  "my.stg.charitableimpact.com"
];

export function validateDomain(url) {
  return ALLOWED_DOMAINS.some(d => url.includes(d));
}


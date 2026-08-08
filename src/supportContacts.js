function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstValue(sources, key) {
  for (const source of sources) {
    const value = clean(source && source[key]);
    if (value) return value;
  }
  return "";
}

export function buildSupportContacts(sources, labels) {
  const contactSources = Array.isArray(sources) ? sources : [sources];
  const phone = firstValue(contactSources, "phone");
  const telegram = firstValue(contactSources, "telegram");
  const email = firstValue(contactSources, "email");
  const contacts = [];

  if (phone) {
    contacts.push({
      key: "call",
      icon: "phone",
      title: labels.call,
      sub: phone,
      href: `tel:${phone.replace(/\s/g, "")}`,
    });
  }
  if (telegram) {
    const handle = telegram.replace(/^@/, "");
    contacts.push({
      key: "tg",
      icon: "chat",
      title: labels.telegram,
      sub: telegram,
      href: /^https?:\/\//i.test(telegram) ? telegram : `https://t.me/${handle}`,
    });
  }
  if (email) {
    contacts.push({
      key: "mail",
      icon: "bell",
      title: labels.email,
      sub: email,
      href: `mailto:${email}`,
    });
  }

  return contacts;
}

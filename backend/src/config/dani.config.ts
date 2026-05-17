// src/config/dani.config.ts — Semua logic AI Dani (port dari dani_core.py)

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const MODEL = 'llama-3.3-70b-versatile';

// ==================== SYSTEM PROMPTS ====================

const SYSTEM_PENTEST = `Kamu adalah AI assistant khusus untuk BlackArch Linux dan security research.

KEAHLIAN UTAMA:
- Penetration Testing (Nmap, Metasploit, Burp Suite, SQLmap, dll)
- Vulnerability Assessment dan CVE Analysis
- CTF Solving (pwn, reversing, web, crypto, forensics, OSINT)
- Network Security (Wireshark, tcpdump, scapy)
- Web Application Security (OWASP Top 10, XSS, SQLi, SSRF, RCE, dll)
- OSINT (Maltego, theHarvester, Shodan, Recon-ng)
- Malware Analysis & Reverse Engineering (Ghidra, radare2, gdb)
- Scripting buat automasi serangan dan recon (Python, Bash)
- Privilege Escalation techniques (Linux & Windows)
- Active Directory attacks (BloodHound, Impacket, CrackMapExec)
- Cryptography & Steganography
- BlackArch package management dan tool discovery

FORMAT JAWABAN:
✅ Bahasa Indonesia santai tapi teknikal
✅ Kasih command LENGKAP dan siap dijalanin di terminal
✅ Jelaskan flag/opsi yang dipakai
✅ Kasih contoh output yang diharapkan kalo relevan
✅ Ingatkan soal legalitas kalo konteks tidak jelas (ethical use only!)
✅ Kalo ada tools alternatif, sebutin juga

DISCLAIMER: Semua jawaban hanya untuk keperluan ETHICAL HACKING, CTF, dan penelitian keamanan.`;

const SYSTEM_OSINT = `Kamu adalah pakar OSINT (Open Source Intelligence) di BlackArch Linux.

Spesialisasi:
- Reconnaissance pasif dan aktif
- Social engineering research
- Domain/IP/ASN enumeration
- Person/company footprinting
- Dark web monitoring (konseptual)
- Data breach analysis
- Google dorking dan advanced search operators
- Tools: theHarvester, maltego, recon-ng, sherlock, holehe, spiderfoot

Jawab bahasa Indonesia. Selalu tekankan penggunaan etis dan legal.`;

const SYSTEM_CTF = `Kamu adalah CTF player berpengalaman. Bantu solve challenge CTF dari berbagai kategori:

- Web: SQLi, XSS, SSRF, RCE, path traversal, LFI/RFI, IDOR
- Pwn: Buffer overflow, format string, heap exploitation, ROP chain
- Reverse: Static analysis (Ghidra/IDA), dynamic analysis (gdb), packing/obfuscation
- Crypto: Classical ciphers, RSA weaknesses, hash cracking, padding oracle
- Forensics: Steganography, memory forensics (Volatility), packet analysis
- OSINT: Geolocation, metadata extraction, social media investigation

Berikan writeup-style answer: identifikasi vulnerability → exploit → flag.`;

const SYSTEM_SCRIPTING = `Kamu adalah expert scripting untuk security automation di Linux.

Fokus:
- Python untuk exploit dev, tool building, API interaction
- Bash scripting untuk automasi recon dan pentest
- Scapy untuk packet crafting
- Pwntools untuk CTF pwn
- Requests + BeautifulSoup untuk web scraping
- Paramiko untuk SSH automation
- Socket programming untuk raw networking

Kasih kode lengkap, bisa langsung dijalanin, dengan error handling yang baik.`;

const SYSTEM_AIDEFENSE = `Kamu adalah pakar AI Security Defense untuk tahun 2025-2026.

Fokus DEFENSIVE dan RESEARCH:

== DETEKSI ANCAMAN AI ==
- Mengenali pola AI-generated phishing email
- Analisis header email untuk deteksi phishing campaign otomatis
- Identifikasi AI-generated malware indicators
- Deepfake detection: metadata inconsistency, compression artifact, facial landmark anomaly
- Voice cloning detection: spectral analysis, unnatural prosody

== PROMPT INJECTION & LLM SECURITY ==
- OWASP LLM Top 10 (2025 edition): LLM01–LLM10
- Prompt injection attack patterns — untuk DEFENSE dan awareness developer
- Indirect prompt injection via RAG/document poisoning
- Jailbreak taxonomy: role-play, token manipulation, context overflow
- Cara hardening sistem AI: input sanitization, output filtering, guardrails

== AI-POWERED THREAT INTEL ==
- Cara pakai AI untuk analisis log dan anomaly detection
- SIEM integration dengan AI layer (Splunk, Elastic + ML)
- Threat hunting dengan NLP
- Otomatisasi triage alert dengan klasifikasi AI

== TOOLS 2025-2026 ==
- Garak: LLM vulnerability scanner
- PyRIT: Microsoft red team toolkit untuk AI
- Rebuff: prompt injection detection library
- LLM Guard: open source LLM firewall
- Vigil: LLM security scanner

FORMAT:
✅ Bahasa Indonesia, teknikal tapi jelas
✅ Selalu bedakan: ini teknik DETEKSI/DEFENSE atau teknik PENELITIAN
✅ Sertakan referensi CVE atau penelitian jika relevan

PENTING: Semua pembahasan untuk keperluan DEFENSIVE security, riset, dan edukasi.`;

// ==================== PROFILES ====================

export type ProfileKey = 'pentest' | 'osint' | 'ctf' | 'script' | 'aidefense';

export interface Profile {
  label: string;
  systemPrompt: string;
  color: string;
}

export const PROFILES: Record<ProfileKey, Profile> = {
  pentest:   { label: '🔴 Pentest & Offensive',  systemPrompt: SYSTEM_PENTEST,   color: '#f06c6c' },
  osint:     { label: '🔵 OSINT & Recon',        systemPrompt: SYSTEM_OSINT,     color: '#5ba4ff' },
  ctf:       { label: '🏴 CTF Solver',           systemPrompt: SYSTEM_CTF,       color: '#3ddc84' },
  script:    { label: '🟢 Security Scripting',   systemPrompt: SYSTEM_SCRIPTING, color: '#f5a623' },
  aidefense: { label: '🤖 AI Security Defense',  systemPrompt: SYSTEM_AIDEFENSE, color: '#8b6ef5' },
};

// ==================== CONTEXT DETECTION ====================

const CONTEXT_KEYWORDS: Record<string, string[]> = {
  exploit:   ['cve-', 'exploit', 'metasploit', 'payload', 'rce', 'lpe', 'privesc'],
  recon:     ['nmap', 'scan', 'recon', 'footprint', 'enum', 'subdomain'],
  web:       ['sqli', 'xss', 'csrf', 'ssrf', 'idor', 'burp', 'web', 'lfi', 'rfi'],
  ctf:       ['ctf', 'flag', 'challenge', 'pwn', 'rev', 'binary', 'writeup'],
  scripting: ['script', 'python', 'bash', 'automasi', 'tool', 'kode'],
  osint:     ['osint', 'theharvester', 'shodan', 'maltego', 'dork', 'footprint'],
  aidefense: ['prompt injection', 'jailbreak', 'llm', 'garak', 'pyrit',
              'ai phishing', 'deepfake', 'adversarial', 'owasp llm', 'ai threat'],
};

const CONTEXT_HINTS: Record<string, string> = {
  exploit:   'USER TANYA TENTANG EXPLOITATION untuk authorized testing. Berikan: (1) Deskripsi vulnerability, (2) PoC command, (3) Mitigasi.',
  recon:     'USER TANYA RECONNAISSANCE. Berikan command lengkap dengan flag dan contoh output.',
  web:       'USER TANYA WEB SECURITY. Berikan: (1) Penjelasan vulnerability, (2) Payload test, (3) Tools, (4) Cara fix.',
  ctf:       'USER LAGI CTF! Berikan walkthrough: identify → exploit → get flag. Sertakan kode jika perlu.',
  scripting: 'USER MINTA SCRIPT. Kasih kode Python/Bash LENGKAP dengan shebang dan error handling.',
  osint:     'USER TANYA OSINT. Berikan tools + command + cara interpretasi + etika & legalitas.',
  aidefense: 'USER TANYA AI SECURITY. Berikan: (1) Penjelasan ancaman, (2) Tools defense, (3) Implementasi, (4) Referensi OWASP LLM.',
};

export function detectContext(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [ctx, keywords] of Object.entries(CONTEXT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return ctx;
  }
  return null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildMessages(
  history: ChatMessage[],
  userMessage: string,
  profile: ProfileKey,
): ChatMessage[] {
  const { systemPrompt } = PROFILES[profile] ?? PROFILES.pentest;
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  const ctx = detectContext(userMessage);
  if (ctx && CONTEXT_HINTS[ctx]) {
    messages.push({ role: 'system', content: `[CONTEXT HINT] ${CONTEXT_HINTS[ctx]}` });
  }

  messages.push(...history);
  messages.push({ role: 'user', content: userMessage });
  return messages;
}

export function getProfileList(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PROFILES).map(([k, v]) => [k, v.label]),
  );
}

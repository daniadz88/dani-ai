// src/lib/profiles.ts

import type { ProfileMeta } from '../types';

export const PROFILES: ProfileMeta[] = [
  { key: 'pentest',   label: 'pentest',   color: '#f06c6c', desc: 'Penetration testing, exploits, vuln assessment' },
  { key: 'osint',     label: 'osint',     color: '#5ba4ff', desc: 'Reconnaissance, footprinting, intel gathering' },
  { key: 'ctf',       label: 'ctf',       color: '#3ddc84', desc: 'CTF solving, writeup-style hints' },
  { key: 'script',    label: 'script',    color: '#f5a623', desc: 'Python / Bash security scripting' },
  { key: 'aidefense', label: 'ai-def',    color: '#8b6ef5', desc: 'AI security, OWASP LLM Top 10' },
];

export const SHORTCUTS = [
  { label: 'nmap stealth',  text: 'Gimana cara nmap stealth scan biar gak kedetect IDS?' },
  { label: 'OWASP LLM',    text: 'Jelasin OWASP LLM Top 10 dan cara mitigasinya' },
  { label: 'CTF LFI',      text: 'CTF web: ada parameter ?file= kemungkinan apa?' },
  { label: 'recon script',  text: 'Buatin Python script buat recon subdomain otomatis' },
  { label: 'privesc Linux', text: 'Cara privilege escalation di Linux step by step?' },
];

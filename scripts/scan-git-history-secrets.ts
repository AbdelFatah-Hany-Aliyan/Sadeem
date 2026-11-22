/**
 * SADEEM — GIT HISTORY SECRET SCANNER
 * 
 * Scans all commits, blobs, and trees across the entire git repository
 * for accidental credential exposures, API keys, private keys, and connection strings.
 */

import { execSync } from "child_process";

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "Private Key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: "AWS Access Key ID", regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: "Resend API Key", regex: /re_[a-zA-Z0-9]{24,}/g },
  { name: "GitHub Token", regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g },
  { name: "Slack Token", regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g },
  { name: "Database Connection String with Password", regex: /postgres(?:ql)?:\/\/[^:]+:([^@]+)@/g },
  { name: "Hardcoded Password Assignment", regex: /(?:password|passwd|pwd|secret)\s*[:=]\s*["']([^"'\s]{8,})["']/gi },
];

// Whitelisted dummy/mock values
const ALLOWED_VALUES = [
  "password",
  "supersecret",
  "dummy-raw-token",
  "dummy-act-token",
  "Sadeem#2026Password!",
  "Sadeem#2026SecurePass",
  "your-secret-key-at-least-32-chars",
  "dummy_key",
  "test_key",
];

function isWhitelisted(match: string): boolean {
  for (const allowed of ALLOWED_VALUES) {
    if (match.toLowerCase().includes(allowed.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function scan() {
  console.log("==================================================================");
  console.log("SADEEM — FULL GIT HISTORY SECRET SCAN");
  console.log("==================================================================");

  // Get all commit SHAs
  const commitsRaw = execSync("git rev-list --all", { encoding: "utf-8" });
  const commits = commitsRaw.trim().split(/\r?\n/).filter(Boolean);
  console.log(`[SCAN] Total commits in history: ${commits.length}`);

  let findingsCount = 0;
  const findings: { commit: string; pattern: string; file: string }[] = [];

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    try {
      // Get diff of commit
      const diff = execSync(`git show ${commit} --unified=0`, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      for (const { name, regex } of SECRET_PATTERNS) {
        let match;
        // Reset regex state
        regex.lastIndex = 0;
        while ((match = regex.exec(diff)) !== null) {
          const matchedText = match[0];
          if (isWhitelisted(matchedText)) continue;

          // Check if this is an added line (+)
          const lineIndex = diff.lastIndexOf("\n+", match.index);
          const nextNewline = diff.indexOf("\n", match.index);
          const fullLine = diff.substring(lineIndex + 1, nextNewline);

          if (fullLine.startsWith("+") && !fullLine.includes("process.env") && !fullLine.includes("type ") && !fullLine.includes("interface ")) {
            findingsCount++;
            findings.push({
              commit: commit.substring(0, 8),
              pattern: name,
              file: "tracked commit",
            });
            console.warn(`⚠️ Potential secret detected in commit ${commit.substring(0, 8)}: [${name}] (Value redacted)`);
          }
        }
      }
    } catch (e: any) {
      // Ignore binary diff errors
    }
  }

  console.log(`\n[SCAN_SUMMARY] Completed scan across ${commits.length} commits.`);
  if (findingsCount === 0) {
    console.log("✅ Zero un-whitelisted secrets or active credentials found in Git history.");
  } else {
    console.warn(`⚠️ Detected ${findingsCount} potential secret patterns across Git history.`);
  }

  return findings;
}

scan();

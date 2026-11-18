/**
 * VaultSecurity - Gerencia pastas privadas, hash de PIN e sessão de desbloqueio.
 */
class VaultSecurity {
  constructor() {
    this.unlockedFolders = new Set();
  }

  async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`megabrain_salt_${pin}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verifyPin(pin, storedHash) {
    const candidate = await this.hashPin(pin);
    return candidate === storedHash;
  }

  isUnlocked(folderId) {
    return this.unlockedFolders.has(folderId);
  }

  unlock(folderId) {
    this.unlockedFolders.add(folderId);
  }

  lock(folderId) {
    this.unlockedFolders.delete(folderId);
  }

  lockAll() {
    this.unlockedFolders.clear();
  }
}

window.VaultSecurity = VaultSecurity;

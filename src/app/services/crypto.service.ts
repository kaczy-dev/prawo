import { Injectable, signal } from '@angular/core';

export interface VaultMetadata {
  salt: string; // Base64
  verificationHash: string; // SHA-256 hash do walidacji hasła
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private readonly VAULT_META_KEY = 'prawnbot_vault_meta';
  private readonly DEFAULT_USER = 'mecenas';

  // Aktywny klucz kryptograficzny w pamięci RAM sesji (AES-GCM)
  private currentKey: CryptoKey | null = null;

  // Sygnały stanu sesji
  readonly isAuthenticated = signal<boolean>(false);
  readonly currentUser = signal<string | null>(null);
  readonly isVaultInitialized = signal<boolean>(false);

  constructor() {
    this.checkInitialVaultState();
  }

  private checkInitialVaultState(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const meta = localStorage.getItem(this.VAULT_META_KEY);
    this.isVaultInitialized.set(!!meta);
  }

  /**
   * Rejestracja / Inicjalizacja skarbca lokalnego hasłem użytkownika
   */
  async initializeVault(password: string): Promise<boolean> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = this.bufferToBase64(salt);

      // Hasz weryfikacyjny (SHA-256 z solą)
      const verificationHash = await this.hashPassword(password, salt);

      const meta: VaultMetadata = {
        salt: saltBase64,
        verificationHash,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(this.VAULT_META_KEY, JSON.stringify(meta));
      this.isVaultInitialized.set(true);

      // Zaloguj od razu po zainicjalizowaniu
      return await this.login(password);
    } catch (error) {
      console.error('Błąd inicjalizacji skarbca:', error);
      return false;
    }
  }

  /**
   * Logowanie przy użyciu lokalnego hasła
   */
  async login(password: string): Promise<boolean> {
    try {
      const metaJson = localStorage.getItem(this.VAULT_META_KEY);
      if (!metaJson) {
        // Jeśli sejf jeszcze nie istnieje, utwórz go z podanym hasłem
        return await this.initializeVault(password);
      }

      const meta: VaultMetadata = JSON.parse(metaJson);
      const salt = this.base64ToBuffer(meta.salt);

      const checkHash = await this.hashPassword(password, salt);
      if (checkHash !== meta.verificationHash) {
        return false;
      }

      // Wyprowadź klucz AES-GCM 256-bit za pomocą PBKDF2
      this.currentKey = await this.deriveKeyFromPassword(password, salt);
      this.isAuthenticated.set(true);
      this.currentUser.set(this.DEFAULT_USER);
      return true;
    } catch (error) {
      console.error('Błąd uwierzytelniania lokalnego:', error);
      return false;
    }
  }

  /**
   * Wylogowanie i usunięcie klucza z pamięci podręcznej RAM
   */
  logout(): void {
    this.currentKey = null;
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  /**
   * Szyfrowanie ciągu tekstowego (AES-GCM 256-bit z losowym IV)
   */
  async encrypt(plainText: string): Promise<string> {
    if (!this.currentKey) {
      throw new Error('Skarbiec jest zablokowany. Wymagane uwierzytelnienie.');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      this.currentKey,
      encodedData
    );

    const payload = {
      iv: this.bufferToBase64(iv),
      data: this.bufferToBase64(cipherBuffer),
    };

    return JSON.stringify(payload);
  }

  /**
   * Deszyfrowanie ciągu tekstowego
   */
  async decrypt(cipherJson: string): Promise<string> {
    if (!this.currentKey) {
      throw new Error('Skarbiec jest zablokowany. Wymagane uwierzytelnienie.');
    }

    try {
      const parsed = JSON.parse(cipherJson);
      if (!parsed.iv || !parsed.data) {
        return cipherJson; // Nie było zaszyfrowane w tym formacie
      }

      const iv = this.base64ToBuffer(parsed.iv);
      const cipherBuffer = this.base64ToBuffer(parsed.data);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as unknown as BufferSource,
        },
        this.currentKey,
        cipherBuffer as unknown as BufferSource
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Błąd deszyfrowania danych:', error);
      throw new Error('Nie udało się odszyfrować danych (nieprawidłowy klucz lub dane uszkodzone).');
    }
  }

  // Pomocnicze funkcje kryptograficzne
  private async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const saltedPwd = new Uint8Array(salt.length + password.length);
    saltedPwd.set(salt, 0);
    saltedPwd.set(encoder.encode(password), salt.length);

    const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPwd as unknown as BufferSource);
    return this.bufferToBase64(hashBuffer);
  }

  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8.byteLength; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

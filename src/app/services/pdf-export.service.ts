import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { EncryptedNote, ThreatAnalysisResult, PenalArticle } from '../models/legal.model';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  /**
   * Eksport notatki adwokackiej do formatu PDF
   */
  exportNoteToPdf(note: EncryptedNote): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Nagłówek kancelaryjny
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(245, 158, 11); // amber-500
    doc.setFontSize(10);
    doc.text('PRAWNBOT – KANCELARYJNY ASYSTENT PRAWA KARNEGO', 15, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('DOKUMENT POUFNY – OBJĘTY TAJEMNICĄ ZAWODOWĄ', 15, 20);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    const dateStr = `Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}`;
    doc.text(dateStr, pageWidth - 15, 20, { align: 'right' });

    currentY = 40;

    // Metadane notatki
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(this.sanitizePolish(note.title), 15, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Kategoria: ${this.sanitizePolish(note.category)} | Ostatnia modyfikacja: ${note.updatedAt}`, 15, currentY);
    currentY += 6;

    if (note.linkedArticle) {
      doc.setTextColor(180, 83, 9);
      doc.text(`Powiązany przepis: ${this.sanitizePolish(note.linkedArticle)}`, 15, currentY);
      currentY += 6;
    }

    if (note.tags.length > 0) {
      doc.setTextColor(100, 116, 139);
      doc.text(`Słowa kluczowe: ${this.sanitizePolish(note.tags.join(', '))}`, 15, currentY);
      currentY += 6;
    }

    // Linia rozdzielająca
    currentY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 10;

    // Treść notatki
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    const safeContent = this.sanitizePolish(note.content);
    const splitLines = doc.splitTextToSize(safeContent, pageWidth - 30);
    
    for (const line of splitLines) {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, 15, currentY);
      currentY += 6;
    }

    // Stopka prawna
    this.addFooter(doc, pageWidth);

    // Zapisz plik
    const filename = `Notatka_${note.title.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}_prawnBot.pdf`;
    doc.save(filename);
  }

  /**
   * Eksport kompletnej analizy "Co mi grozi?" do PDF
   */
  exportThreatAnalysisToPdf(query: string, result: ThreatAnalysisResult): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Nagłówek
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(10);
    doc.text('PRAWNBOT – MODUŁ ANALIZY RYZYKA I ORZECZNICTWA', 15, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('OPINIA PRAWNA: ANALIZA ZAGROŻENIA SANKCJĄ KARNĄ', 15, 20);

    currentY = 38;

    // Wprowadzony stan faktyczny
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(10);
    doc.text('BADANY STAN FAKTYCZNY / ZAPYTANIE:', 15, currentY);
    currentY += 6;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const safeQuery = this.sanitizePolish(`"${query}"`);
    const splitQuery = doc.splitTextToSize(safeQuery, pageWidth - 30);
    doc.text(splitQuery, 15, currentY);
    currentY += splitQuery.length * 6 + 6;

    // Ocena ryzyka
    doc.setFontSize(12);
    doc.setTextColor(180, 83, 9);
    doc.text(`Wstępna ocena stopnia ryzyka: ${result.riskLevel.toUpperCase()}`, 15, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Główny zakres ustawowego zagrożenia: ${this.sanitizePolish(result.primarySentenceRange)}`, 15, currentY);
    currentY += 10;

    // Wyjaśnienie prostym językiem
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('KOMENTARZ KANCELARII (PROSTYM JĘZYKIEM):', 15, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const splitExp = doc.splitTextToSize(this.sanitizePolish(result.plainExplanation), pageWidth - 30);
    doc.text(splitExp, 15, currentY);
    currentY += splitExp.length * 5 + 8;

    // Środki obligatoryjne / dodatkowe
    if (result.mandatoryMeasures.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(185, 28, 28); // red
      doc.text('ŚRODKI OBLIGATORYJNE / NOWE PRZEPISY:', 15, currentY);
      currentY += 6;

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const measure of result.mandatoryMeasures) {
        const lines = doc.splitTextToSize(`• ${this.sanitizePolish(measure)}`, pageWidth - 30);
        doc.text(lines, 15, currentY);
        currentY += lines.length * 5 + 2;
      }
      currentY += 4;
    }

    // Rekomendowane kroki obrony
    if (result.recommendedSteps.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('REKOMENDOWANA STRATEGIA PROCESOWA:', 15, currentY);
      currentY += 6;

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      for (const step of result.recommendedSteps) {
        const lines = doc.splitTextToSize(`[+] ${this.sanitizePolish(step)}`, pageWidth - 30);
        doc.text(lines, 15, currentY);
        currentY += lines.length * 5 + 2;
      }
    }

    // Stopka
    this.addFooter(doc, pageWidth);

    doc.save('Analiza_Zagrozenia_Karnego_prawnBot.pdf');
  }

  /**
   * Eksport pełnego artykułu kodeksu karnego do PDF
   */
  exportArticleToPdf(article: PenalArticle): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(10);
    doc.text('KODEKS KARNY (USTAWA Z DNIA 6 CZERWCA 1997 R. Z PÓŹN. ZM.)', 15, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`ARTYKUŁ ${article.number}${article.suffix || ''} – ${this.sanitizePolish(article.title).toUpperCase()}`, 15, 20);

    currentY = 40;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text(`Rozdział: ${this.sanitizePolish(article.chapter)} (${article.chapterNumber})`, 15, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('TREŚĆ PRZEPISU:', 15, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const splitContent = doc.splitTextToSize(this.sanitizePolish(article.content), pageWidth - 30);
    doc.text(splitContent, 15, currentY);
    currentY += splitContent.length * 5 + 10;

    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9);
    doc.text('WYMIAR USTAWOWEGO ZAGROŻENIA:', 15, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(this.sanitizePolish(article.penalties.summary), 15, currentY);
    currentY += 10;

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('KOMENTARZ I WYJAŚNIENIE PRAKTYCZNE:', 15, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const splitSummary = doc.splitTextToSize(this.sanitizePolish(article.plainSummary), pageWidth - 30);
    doc.text(splitSummary, 15, currentY);

    this.addFooter(doc, pageWidth);
    doc.save(`Art_${article.number}${article.suffix || ''}_Kodeks_Karny.pdf`);
  }

  /**
   * Eksport teczki sprawy (Dossier) z metadanymi klienta, zarzutami i notatkami
   */
  exportCaseDossierToPdf(activeCase: import('../models/legal.model').ActiveCaseItem, linkedNotes: import('../models/legal.model').EncryptedNote[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Nagłówek kancelaryjny
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(212, 175, 55); // złoto kancelaryjne
    doc.setFontSize(10);
    doc.text('PRAWNBOT – KANCELARIA ADWOKACKA / DOSSIER SPRAWY', 15, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('KARTOTEKA SPRAWY KARNEJ – TAJEMNICA OBROŃCZA', 15, 20);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')}`, pageWidth - 15, 20, { align: 'right' });

    currentY = 38;

    // Karta sprawy
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(this.sanitizePolish(activeCase.title), 15, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Klient: ${this.sanitizePolish(activeCase.clientName || 'Brak danych')} | Sygnatura akt: ${this.sanitizePolish(activeCase.caseNumber || 'Brak')}`, 15, currentY);
    currentY += 6;

    doc.text(`Etap postepowania: ${this.sanitizePolish(activeCase.stage)} | Priorytet: ${this.sanitizePolish(activeCase.priority).toUpperCase()}`, 15, currentY);
    currentY += 6;

    if (activeCase.linkedArticleRef) {
      doc.setTextColor(180, 83, 9);
      doc.text(`Zarzut / Podstawa prawna: ${this.sanitizePolish(activeCase.linkedArticleRef)}`, 15, currentY);
      currentY += 6;
    }

    currentY += 2;
    doc.setDrawColor(203, 213, 225);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 8;

    // Opis sprawy
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('STAN FAKTYCZNY I USTALENIA WSTĘPNE:', 15, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(this.sanitizePolish(activeCase.summary), pageWidth - 30);
    doc.text(splitSummary, 15, currentY);
    currentY += splitSummary.length * 5 + 8;

    // Załączone notatki ze spotkań i rozpraw
    if (linkedNotes.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`ZAŁĄCZONE NOTATKI I DOKUMENTY ZE SKARBCU (${linkedNotes.length}):`, 15, currentY);
      currentY += 7;

      for (const n of linkedNotes) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, currentY, pageWidth - 30, 24, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(15, currentY, pageWidth - 30, 24, 2, 2, 'D');

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`• ${this.sanitizePolish(n.title)} (${this.sanitizePolish(n.category)})`, 18, currentY + 6);

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const excerpt = doc.splitTextToSize(this.sanitizePolish(n.content.substring(0, 150)) + '...', pageWidth - 36);
        doc.text(excerpt, 18, currentY + 12);

        currentY += 28;
      }
    }

    this.addFooter(doc, pageWidth);
    const safeFilename = `Teczka_Sprawy_${(activeCase.caseNumber || activeCase.title).substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(safeFilename);
  }

  private addFooter(doc: jsPDF, pageWidth: number): void {
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Wygenerowano automatycznie przez prawnBot (System Prawa Karnego). Dokument ma charakter informacyjny i nie zastępuje indywidualnej porady adwokackiej.',
        pageWidth / 2,
        287,
        { align: 'center' }
      );
    }
  }

  /**
   * Zabezpieczenie polskich znaków dla domyślnych czcionek PDF (ISO / WinAnsi fallback)
   */
  private sanitizePolish(text: string): string {
    if (!text) return '';
    const map: Record<string, string> = {
      ą: 'a',
      ć: 'c',
      ę: 'e',
      ł: 'l',
      ń: 'n',
      ó: 'o',
      ś: 's',
      ź: 'z',
      ż: 'z',
      Ą: 'A',
      Ć: 'C',
      Ę: 'E',
      Ł: 'L',
      Ń: 'N',
      Ó: 'O',
      Ś: 'S',
      Ź: 'Z',
      Ż: 'Z',
    };
    return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => map[char] || char);
  }
}

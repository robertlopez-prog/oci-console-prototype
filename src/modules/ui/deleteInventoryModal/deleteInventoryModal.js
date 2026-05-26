import { LightningElement, track } from 'lwc';

const SAMPLE_CSV_CONTENT = `locationId,sku,requestId
alpine-b2c-chicago,0001,req-001
alpine-b2c-chicago,0002,req-002
marina-sfo-warehouse,0001,req-003
uptown-chicago,WINTER-BOOT-01,req-004`;

export default class DeleteInventoryModal extends LightningElement {
    @track currentStep = 1;   // 1 | 2 | 3
    @track hasFile = false;

    connectedCallback() {
        // Expose component instance on window for Playwright test automation
        window.__deleteModalInstance = this;
    }

    disconnectedCallback() {
        window.__deleteModalInstance = null;
    }
    @track fileName = '';
    @track fileSize = '';
    @track fileFormat = '';
    @track estimatedRows = '—';
    @track isDragOver = false;
    @track isConfirmed = false;
    @track isPreSorted = false;
    @track batchId = '';

    // ── Step computed ────────────────────────────────────────────────
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }

    get stepLabel() {
        const labels = { 1: 'Step 1 of 2: Prepare Your File', 2: 'Step 2 of 2: Review & Confirm', 3: 'Submitted' };
        return labels[this.currentStep] || '';
    }

    // ── Footer button visibility ─────────────────────────────────────
    get showCancelBtn() { return this.currentStep < 3; }
    get showBackBtn()   { return this.currentStep === 2; }

    // ── Disabled states ──────────────────────────────────────────────
    get isNextDisabled()   { return !this.hasFile; }
    get isSubmitDisabled() { return !this.isConfirmed; }

    // ── Progress indicator dots ──────────────────────────────────────
    get progressDot1() {
        return `del-modal__dot${this.currentStep >= 1 ? ' del-modal__dot--active' : ''}${this.currentStep > 1 ? ' del-modal__dot--done' : ''}`;
    }
    get progressDot2() {
        return `del-modal__dot${this.currentStep >= 2 ? ' del-modal__dot--active' : ''}${this.currentStep > 2 ? ' del-modal__dot--done' : ''}`;
    }
    get progressDot3() {
        return `del-modal__dot${this.currentStep >= 3 ? ' del-modal__dot--active' : ''}`;
    }

    // ── Dropzone class ───────────────────────────────────────────────
    get dropzoneClass() {
        return `del-dropzone${this.isDragOver ? ' del-dropzone--over' : ''}${this.hasFile ? ' del-dropzone--has-file' : ''}`;
    }

    // ── Step 1 handlers ──────────────────────────────────────────────
    handleDownloadSample() {
        const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'sample-bulk-delete.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    handleUploadClick() {
        this.template.querySelector('.del-dropzone__input')?.click();
    }

    handleFileChange(event) {
        const file = event.target.files?.[0];
        if (file) this._processFile(file);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.isDragOver = true;
    }

    handleDragLeave() {
        this.isDragOver = false;
    }

    handleDrop(event) {
        event.preventDefault();
        this.isDragOver = false;
        const file = event.dataTransfer?.files?.[0];
        if (file) this._processFile(file);
    }

    handleRemoveFile() {
        this.hasFile   = false;
        this.fileName  = '';
        this.fileSize  = '';
        this.fileFormat = '';
        this.estimatedRows = '—';
    }

    _processFile(file) {
        this.hasFile  = true;
        this.fileName = file.name;

        // Format file size
        if (file.size < 1024) {
            this.fileSize = `${file.size} B`;
        } else if (file.size < 1024 * 1024) {
            this.fileSize = `${(file.size / 1024).toFixed(1)} KB`;
        } else {
            this.fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        }

        // Detect format
        const lc = file.name.toLowerCase();
        if (lc.endsWith('.csv') || lc.endsWith('.csv.gz')) {
            this.fileFormat = 'CSV' + (lc.endsWith('.gz') ? ' (GZIP compressed)' : '');
        } else if (lc.endsWith('.json') || lc.endsWith('.ndjson') || lc.endsWith('.json.gz')) {
            this.fileFormat = 'NDJSON' + (lc.endsWith('.gz') ? ' (GZIP compressed)' : '');
        } else if (lc.endsWith('.gz')) {
            this.fileFormat = 'GZIP compressed';
        } else {
            this.fileFormat = 'Unknown';
        }

        // Estimate row count: rough heuristic (~90 bytes/row CSV uncompressed; ×12 for gzip)
        const isGzip = lc.endsWith('.gz');
        const bytesPerRow = 90;
        const approxRows = isGzip
            ? Math.round((file.size * 12) / bytesPerRow)
            : Math.round(file.size / bytesPerRow);
        this.estimatedRows = approxRows > 1000
            ? `~${(approxRows / 1000).toFixed(0)}K rows (estimated)`
            : `~${approxRows} rows (estimated)`;
    }

    // ── Step 2 handlers ──────────────────────────────────────────────
    handleConfirmChange(event) {
        // Support both LWC custom event (detail.checked) and native checkbox event (target.checked)
        this.isConfirmed = event.detail?.checked ?? event.target?.checked ?? false;
    }

    handlePreSortedChange(event) {
        this.isPreSorted = event.detail?.checked ?? event.target?.checked ?? false;
    }

    // ── Navigation ───────────────────────────────────────────────────
    handleNext() {
        if (this.hasFile) this.currentStep = 2;
    }

    handleBack() {
        this.isConfirmed = false;
        this.currentStep = 1;
    }

    handleSubmit() {
        if (!this.isConfirmed) return;
        // Generate a fake batch ID
        this.batchId = `DEL-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        this.currentStep = 3;
    }

    // ── Step 3 handlers ──────────────────────────────────────────────
    handleViewHistory() {
        this.dispatchEvent(new CustomEvent('submit', {
            detail: { batchId: this.batchId },
            bubbles: true,
            composed: true,
        }));
    }

    // ── Close / backdrop ─────────────────────────────────────────────
    handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    handleBackdropClick(event) {
        // Only close if clicking directly on backdrop (not modal container)
        if (event.target === event.currentTarget) {
            this.handleClose();
        }
    }
}

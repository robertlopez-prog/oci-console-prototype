import { LightningElement, track } from 'lwc';
import { DELETION_JOBS } from 'data/deletionJobs';

const STATUS_BADGE_CLASSES = {
    'Completed': 'dh-badge--completed',
    'Error':     'dh-badge--error',
    'Cancelled': 'dh-badge--cancelled',
    'Running':   'dh-badge--running',
    'Submitted': 'dh-badge--submitted',
};

function enrichJob(job) {
    return {
        ...job,
        statusBadgeClass: STATUS_BADGE_CLASSES[job.status] || '',
        hasRows: job.rowsDeleted > 0 || job.rowsFailed > 0,
        failedCountClass: job.rowsFailed > 0 ? 'dh-count--failed' : '',
        isCancellable: job.status === 'Running' || job.status === 'Submitted',
        isCancelled: job.status === 'Cancelled',
    };
}

export default class DeletionHistoryPanel extends LightningElement {
    @track searchQuery = '';
    @track selectedJobId = null;
    @track _jobs = DELETION_JOBS.map(enrichJob);

    // ── Computed ─────────────────────────────────────────────────────
    get filteredJobs() {
        if (!this.searchQuery.trim()) return this._jobs;
        const q = this.searchQuery.toLowerCase();
        return this._jobs.filter(
            (j) => j.id.toLowerCase().includes(q) ||
                   j.fileName.toLowerCase().includes(q) ||
                   j.submittedBy.toLowerCase().includes(q) ||
                   j.status.toLowerCase().includes(q)
        );
    }

    get noResults() {
        return this.filteredJobs.length === 0;
    }

    get emptyMessage() {
        return this.searchQuery
            ? 'No deletion jobs found matching your search.'
            : 'No deletion jobs found.';
    }

    get recordCountLabel() {
        const total = this._jobs.length;
        const filtered = this.filteredJobs.length;
        return filtered === total
            ? `${total} item${total !== 1 ? 's' : ''}`
            : `${filtered} of ${total} item${total !== 1 ? 's' : ''}`;
    }

    get selectedJob() {
        if (!this.selectedJobId) return null;
        return this._jobs.find((j) => j.id === this.selectedJobId) || null;
    }

    // ── Handlers ─────────────────────────────────────────────────────
    handleSearch(event) {
        this.searchQuery = event.detail.value;
    }

    handleRefresh() {
        // In a real app this would refetch. For the prototype, add a "Running" job at the top.
        const runningJob = enrichJob({
            id: 'DEL-0043',
            externalRef: 'del_new001',
            status: 'Running',
            submittedBy: 'bidemo',
            startedAt: new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
            finishedAt: '—',
            totalRows: 0,
            rowsDeleted: 0,
            rowsFailed: 0,
            fileName: 'latest-batch.csv.gz',
            resultAvailable: false,
            resultExpired: false,
        });
        // Only add if not already present
        if (!this._jobs.find((j) => j.id === 'DEL-0043')) {
            this._jobs = [runningJob, ...this._jobs];
        }
    }

    handleJobClick(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.id;
        this.selectedJobId = this.selectedJobId === id ? null : id;
    }

    handleCloseDrawer() {
        this.selectedJobId = null;
    }

    handleDownloadResults(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.id || this.selectedJobId;
        const job = this._jobs.find((j) => j.id === id);
        if (!job) return;

        // Simulate a download by creating a stub NDJSON file
        const summary = JSON.stringify({
            batchId: job.id,
            status: job.status,
            submittedAt: job.startedAt,
            finishedAt: job.finishedAt,
            totalRows: job.totalRows,
            successful: job.rowsDeleted,
            rejected: 0,
            failed: job.rowsFailed,
        });
        const row1 = JSON.stringify({ rowNumber: 1, locationId: 'alpine-b2c-chicago', sku: '0001', requestId: 'req-001', outcome: 'SUCCESS', rejectionCode: null, rejectionMessage: null });
        const content = `${summary}\n${row1}\n`;
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${job.id}-results.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    handleCancelJob(event) {
        const id = event.currentTarget.dataset.id;
        this._jobs = this._jobs.map((j) => {
            if (j.id !== id) return j;
            return enrichJob({ ...j, status: 'Cancelled', finishedAt: new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) });
        });
    }
}

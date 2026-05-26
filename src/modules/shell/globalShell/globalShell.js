import { LightningElement, api } from 'lwc';

export default class GlobalShell extends LightningElement {
    @api currentPage = null;
    @api workspacePaths = {};

    handleNavigate(event) {
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('navigate', { detail: event.detail, bubbles: true, composed: true }));
    }

    handlePanelSelect(event) {
        this.dispatchEvent(new CustomEvent('panelselect', { detail: event.detail, bubbles: true, composed: true }));
    }
}

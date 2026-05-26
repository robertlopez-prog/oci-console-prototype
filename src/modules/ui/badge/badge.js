import { LightningElement, api } from 'lwc';

const VARIANT_CLASSES = {
    success: 'slds-badge slds-badge_success',
    warning: 'slds-badge slds-badge_warning',
    error: 'slds-badge slds-badge_error',
    inverse: 'slds-badge slds-badge_inverse',
    lightest: 'slds-badge slds-badge_lightest',
};

export default class Badge extends LightningElement {
    @api label;
    @api variant;

    get computedClass() {
        return VARIANT_CLASSES[this.variant] || 'slds-badge';
    }
}

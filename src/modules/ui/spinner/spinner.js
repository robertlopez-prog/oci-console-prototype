import { LightningElement, api } from 'lwc';

export default class Spinner extends LightningElement {
    @api alternativeText = 'Loading';
    @api size = 'medium';
    @api variant;

    get computedClass() {
        const classes = ['slds-spinner', `slds-spinner_${this.size}`];
        if (this.variant) {
            classes.push(`slds-spinner_${this.variant}`);
        }
        return classes.join(' ');
    }
}

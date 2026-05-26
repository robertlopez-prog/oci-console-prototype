import { LightningElement, api } from 'lwc';

export default class Avatar extends LightningElement {
    @api src;
    @api initials;
    @api alternativeText;
    @api size = 'medium';
    @api variant;
    @api fallbackIconName = 'standard:user';

    get computedClass() {
        const classes = ['slds-avatar', `slds-avatar_${this.size}`];
        if (this.variant === 'circle') {
            classes.push('slds-avatar_circle');
        }
        return classes.join(' ');
    }

    get hasSrc() {
        return !!this.src;
    }

    get hasInitials() {
        return !this.src && !!this.initials;
    }
}

import { LightningElement, api } from 'lwc';
export default class extends LightningElement {
    @api variant;
    @api size;
    @api label;
    @api value;
    @api placeholder;
    @api type;
    @api readOnly;
    @api layout;
    @api gap;
    @api flex;
    @api alignItems;
    @api flow;
    @api labelHidden;
    @api checked;
    @api name;
}

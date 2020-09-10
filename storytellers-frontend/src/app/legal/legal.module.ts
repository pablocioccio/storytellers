import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';



@NgModule({
  declarations: [PrivacyPolicyComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ],
  imports: [
    CommonModule
  ]
})
export class LegalModule { }

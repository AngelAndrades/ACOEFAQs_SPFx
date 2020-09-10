import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

//import styles from './AcoeFaQsWebPart.module.scss';
import * as strings from 'AcoeFaQsWebPartStrings';

export interface IAcoeFaQsWebPartProps {
  faqList: string;
  categoriesList: string;
}

import * as $ from 'jquery';
import '@progress/kendo-ui';
import { SPComponentLoader } from '@microsoft/sp-loader';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import { sp } from '@pnp/sp';
import { SPA } from './apps/spa';

export default class AcoeFaQsWebPart extends BaseClientSideWebPart<IAcoeFaQsWebPartProps> {

  protected onInit(): Promise < void > {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context,
        sp: {
          headers: {
            Accept: 'application/json;odata=nometadata'
          }
        }
      });
    });
  }

  public render(): void {
    /*
      Load external CDN files (JS/CSS)
    */
    SPComponentLoader.loadCss('https://kendo.cdn.telerik.com/2020.2.617/styles/kendo.common-material.min.css');
    SPComponentLoader.loadCss('https://kendo.cdn.telerik.com/2020.2.617/styles/kendo.material.min.css');

    SPComponentLoader.loadScript('https://kendo.cdn.telerik.com/2020.2.617/js/jszip.min.js');
    //SPComponentLoader.loadScript('https://kendo.cdn.telerik.com/2020.2.617/js/kendo.all.min.js');

    if (this.properties.faqList != null && this.properties.categoriesList != null) {
      this.domElement.innerHTML = `
        <style>
        .k-autocomplete .k-input, .k-textbox>input, .k-dropdown, .k-textbox, .k-numerictextbox {
            display: block;
            width: 560px;
        }
        div.k-edit-form-container {
            width: 800px;
            height: auto;
        }
        .k-grid  .k-grid-header  .k-header  .k-link {
            height: auto;
        }
        .k-grid  .k-grid-header  .k-header {
            white-space: normal;
        }
        .k-edit-label {
            width: 20%;
        }
        .k-edit-field {
            width: 70%;
        }
        </style>

        <div id="tabStrip">
          <ul>
            <li class="k-state-active">FAQs</li>
            <li>Categories</li>
          </ul>
          <div>
            <div id="faqGrid"></div>
          </div>
          <div>
            <div id="categoriesGrid"></div>
          </div>
        </div>
      `;

      const app = SPA.getInstance(this.properties.faqList, this.properties.categoriesList);
    } else {
      this.domElement.innerHTML = `
        <div>
        <h1>Modify the property pane of this web part and assign the following list:</h1>
        <ul>
          <li>FAQ Custom List</li>
          <li>Categories Custom List</li>
        </ul>
        </div>
      `;
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyFieldListPicker('faqList', {
                  label: 'FAQs Custom List',
                  selectedList: this.properties.faqList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  onGetErrorMessage: null,
                  deferredValidationTime: 0,
                  key: 'listPickerFieldId'
                }),
                PropertyFieldListPicker('categoriesList', {
                  label: 'Categories Custom List',
                  selectedList: this.properties.categoriesList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  onGetErrorMessage: null,
                  deferredValidationTime: 0,
                  key: 'listPickerFieldId'
                })                
              ]
            }
          ]
        }
      ]
    };
  }
}

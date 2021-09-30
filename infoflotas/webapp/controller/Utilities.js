sap.ui.define([
	"sap/ui/base/ManagedObject",
    "sap/ui/layout/form/FormElement",
    "sap/ui/layout/form/FormContainer"
], function(
	ManagedObject,
	FormElement,
	FormContainer
) {
	"use strict";

	return ManagedObject.extend("com.tasa.infoflotas.controller.Utilities", {

        /**
         * @override
         * @param {any} [sId] 
         * @param {any} [mSettings] 
         * @param {any} [oScope] 
         * @returns {sap.ui.base.ManagedObject}
         */
        constructor: function(sId) {
            const FORM_APPS={
                S01:this.setFormS01,
                S02:this.setFormS02
            }
            return FORM_APPS[sId]();
        },

        setFormS01:function(){
            let oFormElement1 = new FormElement(),
            oFormElement2 = new FormElement(),
            oFormContainer = new FormContainer;
            oFormElement1.setLabel("Fecha");
            oFormElement2.setLabel("MotivoMarea");
            oFormElement1.addField(new sap.m.DatePicker);
            oFormElement2.addField(new sap.m.Select)
            oFormContainer.addFormElement(oFormElement1);
            oFormContainer.addFormElement(oFormElement2);
            // this._oView.addDependent(oFormContainer);
            return oFormContainer;
        },

        setFormS02:function(){
            let oFormElement1 = new FormElement({label:"Temporada"}),
            oFormElement2 = new FormElement({label:"Fecha"}),
            oFormElement3 = new FormElement({label:new sap.m.Label({text:"Tipo de embarcación"})}),
            oFormContainer=new FormContainer;

            oFormElement1.addField(new sap.m.Input({
                valueHelpOnly:true,
                showValueHelp:true
            }));
            oFormElement2.addField(new sap.m.DateRangeSelection({
                change:function(oEvent){
                    console.log(oEvent)
                }.bind(this)
            }));
            oFormElement3.addField(new sap.m.Select({
                change:function(oEvent){
                    console.log(oEvent)
                }.bind(this)
            }));
            oFormContainer.addFormElement(oFormElement1);
            oFormContainer.addFormElement(oFormElement2);
            oFormContainer.addFormElement(oFormElement3);
            return oFormContainer;
        }
	});
});
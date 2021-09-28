sap.ui.define([
	"sap/ui/base/ManagedObject"
], function(
	ManagedObject
) {
	"use strict";

	return ManagedObject.extend("com.tasa.infoflotas.controller.Fragments", {
        /**
         * @override
         * @param {any} [sId] 
         * @param {any} [mSettings] 
         * @param {any} [oScope] 
         * @returns {sap.ui.base.ManagedObject}
         */
        constructor: function(oView,sIdFrag) {
            this._oView = oView;
            this._oControl = sap.ui.xmlfragment(oView.getId(),"com.tasa.infoflotas.fragments.table"+sIdFrag);
        },

        getControl:function(){
            return this._oControl;
        }
	});
});
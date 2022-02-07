sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"sap/ui/model/Filter"
], function (BaseController, JSONModel, History, formatter,Filter) {
	"use strict";

	return BaseController.extend("com.tasa.pcomptproduce.controller.Embarcaciones", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy : true,
					delay : 0
				});

			this.getRouter().getRoute("embarcacion").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "embarcacionesView");
			this.getOwnerComponent().getModel().dataLoaded().then(function () {
					// Restore original busy indicator delay for the object view
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				}
			);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */


		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("object", {objectId:0}, true);
			}
		},

		onRowsUpdatedTable:function(oEvent){
			let oTable = oEvent.getSource(),
			aRows = oTable.getAggregation("rows");
			aRows.forEach(row => {
				row.addStyleClass("classRow");
			});
		},

		onPress: async function(oEvent){
			let oContext = oEvent.getSource().getBindingContext(),
			oModel = oContext.getModel(),
			aDiasEmba = oModel.getProperty("/embarcaciones/str_ped"),
			oObject = oContext.getObject(),
			sCodEmba = oObject.CDEMB;
			
			aDiasEmba = this._calcularFilasTotales(aDiasEmba);
			let oDiasEmbaDialog = await this.loadFragment({name:"com.tasa.pcomptproduce.view.fragments.DiasEmba"});
			oDiasEmbaDialog.open();
			this._applyDiasEmbaFilters(sCodEmba);
		},

		onCloseDialog:function(oEvent){
			oEvent.getSource().getParent().close();
			oEvent.getSource().getParent().destroy();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
			var sObjectId =  oEvent.getParameter("arguments").objectId,
			oModel = this.getModel(),
			sPathRow = oModel.getProperty("/pathRow");
			this.getModel().dataLoaded().then( function() {
				// var sObjectPath = this.getModel().createKey("Products", {
				// 	ProductID :  sObjectId
				// });
				this._bindView( `/${sPathRow}/${sObjectId}`);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("embarcacionesView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this)
				}
			});
			oViewModel.setProperty("/busy", false);
		},

		_onBindingChange:function(oEvent){
			let oContext = oEvent.getSource().getBoundContext(),
			oObject = oContext.getObject(),
			oModel = oContext.getModel(),
			oEmbarcaciones = oModel.getProperty("/embarcaciones"),
			oSelectedPuerto = oModel.getProperty("/selectedPuerto"),
			aEmbarcaciones = oEmbarcaciones.str_pem,
			aPuertos = oEmbarcaciones.str_pto,
			sCodZona = oSelectedPuerto.CDZLT,
			sCodPuerto = "",
			oPuerto = {},
			aTableData = [];

			oPuerto = aPuertos.find(puerto => puerto.CDZLT === sCodZona);
			sCodPuerto = oPuerto.CDPTO;
			aTableData = aEmbarcaciones.filter(row => row.CDPTO === sCodPuerto && row.CDZLT ===  sCodZona);
			oModel.setProperty("/table",aTableData)
		},

		_applyDiasEmbaFilters:function(sCodEmba){
			let oTable = this.getView().byId("diasEmbaTableId"),
			oBindingTable = oTable.getBinding("rows"),
			aFilters = [],
			oFilter = {};

			oFilter = new Filter([
				new Filter("CDEMB","EQ",sCodEmba)
			],true);

			aFilters.push(oFilter);
			if(oBindingTable){
				oBindingTable.filter(aFilters);
			}
		},

		_calcularFilasTotales:function(aDiasEmba){
			let aData = [],
			iTotal = 0;
			aDiasEmba.forEach(row => {
				iTotal += row.CNPDS
			});

			aDiasEmba.push({
				CNPDS: iTotal
			});
			return aDiasEmba;
		}

	});

});
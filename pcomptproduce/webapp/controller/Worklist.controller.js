sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/core/BusyIndicator"
], function (
	BaseController,
	JSONModel,
	formatter,
	Filter,
	FilterOperator,
	Fragment,
	BusyIndicator) {
	"use strict";
	
	const HOST = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
	const HOST2 = "https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com/9acc820a-22dc-4d66-8d69-bed5b2789d3c.AyudasBusqueda";

	return BaseController.extend("com.tasa.pcomptproduce.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			// iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
				tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay : 0,
				empresaIndex:1,
				fechaIndex:0,
				selectedArmador: false,
				selectedReceptor: true,
				selectedFecha:false,
				selectedTemp:true
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			// oTable.attachEventOnce("updateFinished", function(){
			// 	// Restore original busy indicator delay for worklist's table
			// 	oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			// });
			oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress : function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack : function() {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},


		onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("ProductName", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/**
		 * Event handler for select empresa
		 * @param {event} oEvent 
		 */
		onSelectEmpresa:function(oEvent){

		},

		/**
		 * Event handler for select fecha
		 * @param {event} oEvent 
		 */
		onSelectFecha:function(oEvent){

		},

		/**
		 * Event handler for 'Ayuda de Busqueda de Embarcacion'
		 * @param {event} oEvent 
		 */
		 onShowSearchHelpEmb: async function(oEvent){
			let oView = this.getView(),
			oModel = this.getModel(),
			sUrl = HOST2 + ".busqembarcaciones-1.0.0",
			nameComponent = "busqembarcaciones",
			idComponent = "busqembarcaciones";

			if(!this.DialogComponent){
				this.DialogComponent = await Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.BusqEmbarcacion",
					controller:this
				});
				oView.addDependent(this.DialogComponent);
			}
			oModel.setProperty("/idDialogComp",this.DialogComponent.getId());
			
			let compCreateOk = function(){
				BusyIndicator.hide()
			}
			if(this.DialogComponent.getContent().length===0){
				BusyIndicator.show(0);
				const oContainer = new sap.ui.core.ComponentContainer({
					id: idComponent,
					name: nameComponent,
					url: sUrl,
					settings: {},
					componentData: {},
					propagateModel: true,
					componentCreated: compCreateOk,
					height: '100%',
					// manifest: true,
					async: false
				});
				this.DialogComponent.addContent(oContainer);
			}

			this.DialogComponent.open();
		},

		/**
		 * Event handler for 'Ayuda de busqueda de temporadas'
		 * @param {event} oEvent 
		 */

		onShowSearchHelpTemporadas: async function(oEvent){
			let oView = this.getView(),
			oModel = this.getModel(),
			sUrl = HOST2 + ".busqtemporada-1.0.0",
			nameComponent = "busqtemporada",
			idComponent = "busqtemporada";

			if(!this.DialogComponentTemp){
				this.DialogComponentTemp = await Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.BusqTemporadas",
					controller:this
				});
				oView.addDependent(this.DialogComponentTemp);
			}
			oModel.setProperty("/idDialogComp",this.DialogComponentTemp.getId());

			let compCreateOk = function(){
				BusyIndicator.hide()
			}
			if(this.DialogComponentTemp.getContent().length===0){
				BusyIndicator.show(0);
				const oContainer = new sap.ui.core.ComponentContainer({
					id: idComponent,
					name: nameComponent,
					url: sUrl,
					settings: {},
					componentData: {},
					propagateModel: true,
					componentCreated: compCreateOk,
					height: '100%',
					// manifest: true,
					async: false
				});
				this.DialogComponentTemp.addContent(oContainer);
			}

			this.DialogComponentTemp.open();
		},

		/**
		 * Event handler for 'Ayuda de busqueda empresa receptora'
		 * @param {event} oEvent 
		 */
		onSelectedEmpresaRecep:function(oEvent){
			let oSelectedRow = oEvent.getParameter("selectedRow"),
			oContext = oSelectedRow.getBindingContext(),
			oObject = oContext.getObject(),
			oModel = oContext.getModel(),
			sEmpresaCod = oObject["LIFNR"],
			sEmpresaDesc = oObject["NAME1"];
			// oModel.setProperty("/searchForm/empresaCod", sEmpresaCod);
			oModel.setProperty("/searchForm/empresaDesc", sEmpresaDesc); 
		},

		onSelectGrupoEmpresarial:function(){

		},

		/**
		 * Event handler for 'Boton de Busqueda'
		 */
		onSearchTable:function(){
			let oModel = this.getModel(),
			oService = {},
			oFormData = oModel.getProperty("/searchForm");
			oModel.setProperty("/itemsTab",[
				{key:"01",text:"Uno"},
				{key:"02",text:"Dos"},
			]);
			this.count = 0; 
			this.countService = 1;
			let oTemp = oModel.getProperty("/help")
			let param={
				cdusr: "",
				fieldstr_emp: [],
				fieldstr_epp: [],
				fieldstr_gre: [],
				fieldstr_gzp: [],
				fieldstr_ped: [],
				fieldstr_pem: [],
				fieldstr_pge: [],
				fieldstr_pto: [],
				fieldstr_zlt: [],
				fieldstr_zpl: [],
				p_cdgre: "",
				p_cdpcn: /*oTemp["CDPCN"]*/"0000000047",
				p_ctgra: "",
				p_emba: oTemp["CDEMB"]?"E":"",
				p_empeb: oTemp["CDEMB"],
				p_fefin: /*formatter.setFormatDateYYYYMMDD(oTemp.FHFTM)*/"20210423",
				p_feini: /*formatter.setFormatDateYYYYMMDD(oTemp.FHITM)*/"20210731",
				p_grueb: "",
				p_options: [],
				p_tcons: "P",
				p_zcdzar: ""
			  };
			oService.path = HOST+ "/api/sistemainformacionflota/PescaCompetenciaProduce";
			oService.model = oModel;
			  oService.param = param;
			  this._getDataMainTable(oService);
		},

		/**
		 * Event handler for 'Boton de Limpiar'
		 */
		onclearFilter:function(){
			let oModel = this.getModel();
			oModel.setProperty("/searchForm", {})
		},

		/**
		 * Event Handler for to close Dialog
		 * @param {event} oEvent 
		 */
		onCloseDialog:function(oEvent){
			let oDialog = oEvent.getSource().getParent();
			oDialog.close();
		},


		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject : function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getPath().split("/")[2]
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		_getDataMainTable:async function(oService){
			let oDataTable = await this.getDataService(oService),
			oModel = this.getModel();
			if(oDataTable){
				oModel.setProperty("/tableItems", oDataTable)
			}
		}

	});
});
sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/Popup"
], function (
	BaseController,
	JSONModel,
	formatter,
	Filter,
	FilterOperator,
	Fragment,
	BusyIndicator,
	Popup) {
	"use strict";

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
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				empresaIndex: 1,
				fechaIndex: 0,
				tempState: "None",
				fechaState: "None",
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

		onRowsDataChange:function(oEvent){
			let oRowBinding = oEvent.getSource(),
			iTotalRows = oRowBinding.iLength,
			oViewModel = this.getModel("worklistView"),
			sTitle;
			oViewModel.setProperty("/tabCount","")
			if(iTotalRows && oRowBinding.isLengthFinal()){
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalRows]);
				oViewModel.setProperty("/tabCount",iTotalRows)
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			oViewModel.setProperty("/worklistTableTitle", sTitle);

		},

		onSort:function(oEvent){
			console.log(oEvent.getParameters())
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
			let iEmpresaIndex = oEvent.getParameter("selectedIndex"),
			oModel = this.getModel();
			if(iEmpresaIndex === 0) {
				oModel.setProperty("/help",{
					CDEMP: "",
					DSEMP: "",
					RUCPRO: ""
				});
			}else{
				oModel.setProperty("/help",{
					sKeyCateg: "",
					CTGRA: "",
					CDGRE: "",
					DSGRE: "",
					CDEMP: "",
					DSEMP: "",
					RUCPRO: ""
				});
			}
		},

		/**
		 * Event handler for select fecha
		 * @param {event} oEvent 
		 */
		onSelectFecha:function(oEvent){
			let iFechaIndex = oEvent.getParameter("selectedIndex"),
			oModel = this.getModel();
			if(iFechaIndex === 0) {
				oModel.setProperty("/help",{
					dateRange: "",
					ZCDZAR: "",
					CDEMP: "",
					DSEMP: "",
					RUCPRO: ""
				});
			}else{
				oModel.setProperty("/help/FHITM","");
				oModel.setProperty("/help/FHFTM","");
				oModel.setProperty("/help/DSPCN","");
				oModel.setProperty("/help/CDEMP","");
				oModel.setProperty("/help/DSEMP","");
				oModel.setProperty("/help/RUCPRO","");
			}
		},

		/**
		 * Event handler for 'Ayuda de Busqueda de Embarcacion'
		 * @param {event} oEvent 
		 */
		 onShowSearchHelpEmb: async function(oEvent){
			let sIdInput = oEvent.getSource().getId(),
			oView = this.getView(),
			oModel = this.getModel(),
			oContainer = oModel.getProperty("/busqembarcaciones"),
			oInput = oView.byId(sIdInput);
			oModel.setProperty("/input",oInput);

			if(!this.DialogComponent){
				this.DialogComponent = await Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.BusqEmbarcacion",
					controller:this
				});
				oView.addDependent(this.DialogComponent);
				oModel.setProperty("/idDialogComp",this.DialogComponent.getId());
			}
			
			if(this.DialogComponent.getContent().length===0){
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
			oContainer = oModel.getProperty("/busqtemporada");

			if(!this.DialogComponentTemp){
				this.DialogComponentTemp = await Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.BusqTemporadas",
					controller:this
				});
				oView.addDependent(this.DialogComponentTemp);
				oModel.setProperty("/idDialogComp",this.DialogComponentTemp.getId());
			}

			// let compCreateOk = function(){
			// 	BusyIndicator.hide()
			// }
			if(this.DialogComponentTemp.getContent().length===0){
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
			sEmpresaDesc = oObject["DSEMP"];
			// oModel.setProperty("/searchForm/empresaCod", sEmpresaCod);
			oModel.setProperty("/help/DSEMP", sEmpresaDesc); 
		},

		onSelectGrupoEmpresarial:function(oEvent){
			let oSelectedRow = oEvent.getParameter("selectedRow"),
			oContext = oSelectedRow.getBindingContext(),
			oObject = oContext.getObject(),
			oModel = oContext.getModel(),
			sGrupoaDesc = oObject["DSGRE"],
			sGrupoCat = oObject["CTGRA"];
			oModel.setProperty("/help/CTGRA", sGrupoCat);
			oModel.setProperty("/help/DSGRE", sGrupoaDesc); 
		},

		/**
		 * Event handler for 'Boton de Busqueda'
		 */
		onSearchTable: async function(){
			let oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			sFechaIndex = oViewModel.getProperty("/fechaIndex"),
			sEmpresaIndex = oViewModel.getProperty("/empresaIndex"),
			oFormData = oModel.getProperty("/help"),
			sFecha = oFormData["dateRange"],
			sFHITM = oFormData["FHITM"],
			sValueStateFecha = oViewModel.getProperty("/fechaState"),
			sValueStateTemp = oViewModel.getProperty("/tempState");

			if(sFechaIndex === 1) {
				if(!sFecha) {
					oViewModel.setProperty("/fechaState","Error");
					return;
				}
				if(sValueStateFecha === "Error") oViewModel.setProperty("/fechaState","Success");
			}else{
				if(!sFHITM) {
					oViewModel.setProperty("/tempState","Error");
					return;
				}
				if(sValueStateTemp === "Error") oViewModel.setProperty("/tempState","Success");
			}

			let oService = {};
			oModel.setProperty("/itemsTab",[
				{key:"01",text:"Uno"},
				{key:"02",text:"Dos"},
			]);
			this.Count = 0; 
			this.CountService = 1;
			let param={
				cdusr: await this.getCurrentUser(),
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
				// p_cdpcn: oTemp["CDPCN"],
				p_ctgra: "",
				// p_emba: oTemp["CDEMB"]?"E":"",
				// p_empeb: oTemp["CDEMB"],
				// p_fefin: formatter.setFormatDateYYYYMMDD(oTemp.FHFTM),
				p_feini: formatter.setFormatDateYYYYMMDD(oTemp.FHITM),
				p_grueb: "",
				p_options: [],
				p_tcons: "P",
				p_zcdzar: ""
			  };
			oService.url = this.getHostService() +  "/api/sistemainformacionflota/PescaCompetenciaProduce";
			oService.serviceName = "Pesca de competencia produce";
			oService.param = param;
			this._getDataMainTable(oService);
		},

		/**
		 * Event handler for 'Boton de Limpiar'
		 */
		onclearFilter:function(){
			let oModel = this.getModel();
			oModel.setProperty("/help", {});
			oModel.setProperty("/tableItems", {})
		},

		/**
		 * Event Handler for to close Dialog
		 * @param {event} oEvent 
		 */
		onCloseDialog:function(oEvent){
			let oDialog = oEvent.getSource().getParent();
			oDialog.close();
		},

		onAbrirZonas: async function(oEvent){
			
			var oButton = oEvent.getSource(),
			oView = this.getView(),
			sTableId = oView.byId("table");
			Popup.setWithinArea(sTableId);
			
			// Create popover
			if (!this._pListPopover) {
				this._pListPopover = await Fragment.load({
					id: oView.getId(),
					name: "com.tasa.pcomptproduce.view.fragments.PuertosZona",
					controller: this
				});

				oView.addDependent(this._pListPopover);
				// this._pListPopover.bindElement("/tableItems");
			}
			this._pListPopover.openBy(oButton);
		},

		onSeleccionarPuerto:function(oEvent){
			this._pListPopover.close();
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

		_getDataMainTable: async function(oService){
			let oDataTable = await this.getDataService(oService),
			oModel = this.getModel();
			if(oDataTable){
				oModel.setProperty("/tableItems", oDataTable)
			}
		}

	});
});
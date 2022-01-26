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
				fechaIndex: 0,
				tempState: "None",
				fechaState: "None",
				selectedArmador: false,
				selectedReceptor: true,
				selectedFecha:false,
				selectedTemp:true,
				indicadorPropiedad:"D",
				bMostrarPuertos:false
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

		onAfterRendering:function(oEvent){
			let oModel = this.getModel(),
			oPage = this.getView().byId("page"),
			iEmpresaIndex = oModel.getProperty("/empresaIndex");

			if(iEmpresaIndex === 1){
				Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.TablaRecep",
					controller:this
				}).then(oTable=>{
					oPage.setContent(oTable);
				});
			} 
			
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
			oModel = this.getModel(),
			aColumnZonas = oModel.getProperty("/oDataApp/str_zlt"),
			sTitle;

			oViewModel.setProperty("/tabCount","");
			if(iTotalRows && oRowBinding.isLengthFinal()){
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalRows]);
				oViewModel.setProperty("/tabCount",iTotalRows);
				oViewModel.setProperty("/indicadorPropiedad","D")
				this._buildColumns(aColumnZonas,"CNPDS","CNDSH");
				
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			oViewModel.setProperty("/worklistTableTitle", sTitle);
			this._formatTotales(iTotalRows);
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

		onPressEmba:function(oItem){
			this.getRouter().navTo("embarcacion", {
				objectId: oItem.getBindingContext().getPath().split("/")[2]
			});
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
			oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			sTitle;
			if(iEmpresaIndex === 0) {
				oModel.setProperty("/help/CDEMP","");
				oModel.setProperty("/help/DSEMP","");
				oModel.setProperty("/help/RUCPRO","");
			}else{
				oModel.setProperty("/help/sKeyCateg","");
				oModel.setProperty("/help/CTGRA","");
				oModel.setProperty("/help/CDGRE","");
				oModel.setProperty("/help/DSGRE","");
				oModel.setProperty("/help/CDEMB","");
				oModel.setProperty("/help/CDEMP","");
				oModel.setProperty("/help/KUNNR","");
				oModel.setProperty("/help/NMEMB","");
				oModel.setProperty("/help/MREMB","");
				oModel.setProperty("/help/NAME1","");
			}

			sTitle = this.getResourceBundle().getText("worklistTableTitle");
			oViewModel.setProperty("/worklistTableTitle", sTitle);
			oViewModel.setProperty("/bMostrarPuertos",false);
			oModel.setProperty("/tableRows",{});
			this._destroyColumns();
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
					ZCDZAR: ""
				});
			}else{
				oModel.setProperty("/help",{
					FHITM: "",
					FHFTM: "",
					CDPCN: "",
					DSPCN: "",
					CDEMP: "",
					DSEMP: "",
					ZCDZAR: ""
				});
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
			 if(!oInput) oInput = sap.ui.getCore().byId(sIdInput);
			 oModel.setProperty("/input",oInput);
			 
			 if(!this.DialogComponent){
				 BusyIndicator.show(0);
				this.DialogComponent = await Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.BusqEmbarcacion",
					controller:this
				});
				oView.addDependent(this.DialogComponent);
			}
			oModel.setProperty("/idDialogComp",this.DialogComponent.getId());
			
			oContainer.attachComponentCreated(function(evt){
				BusyIndicator.hide();
			});
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
				BusyIndicator.show(0);
				this.DialogComponentTemp = await Fragment.load({
					name:"com.tasa.pcomptproduce.view.fragments.BusqTemporadas",
					controller:this
				});
				oView.addDependent(this.DialogComponentTemp);
			}
			oModel.setProperty("/idDialogComp",this.DialogComponentTemp.getId());
			
			oContainer.attachComponentCreated(function(evt){
				BusyIndicator.hide();
			});
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
			oTable = this.getView().byId("table"),
			oUser = await this.getCurrentUser(),
			oViewModel = this.getModel("worklistView"),
			iFechaIndex = oViewModel.getProperty("/fechaIndex"),
			iEmpresaIndex = oViewModel.getProperty("/empresaIndex"),
			oFormData = oModel.getProperty("/help"),
			sFecha = oFormData["dateRange"],
			sFHITM = oFormData["FHITM"],
			sValueStateFecha = oViewModel.getProperty("/fechaState"),
			sValueStateTemp = oViewModel.getProperty("/tempState"),
			sPath = "/tableRows",
			sFechaInicio,
			sFechaFin,
			sOptionsKeys,
			sOptionsLowValue,
			oService = {};

			oTable.unbindRows();

			if(iFechaIndex === 1) {
				if(!sFecha) {
					oViewModel.setProperty("/fechaState","Error");
					return;
				}
				if(sValueStateFecha === "Error") oViewModel.setProperty("/fechaState","Success");
				sFechaInicio = sFecha.split("-")[0].trim();
				sFechaFin = sFecha.split("-")[1].trim();
				sOptionsKeys = "EMPTA";
				sOptionsLowValue = oFormData["CDEMP"]; 
			}else{
				if(!sFHITM) {
					oViewModel.setProperty("/tempState","Error");
					return;
				}
				if(sValueStateTemp === "Error") oViewModel.setProperty("/tempState","Success");
				sFechaFin = oFormData["FHFTM"];
				sFechaInicio = sFHITM;
				sOptionsKeys = "CDEMB"
				sOptionsLowValue = oFormData["CDEMB"]; 
			}

			this.Count = 0; 
			this.CountService = 1;
			let param={
				cdusr: oUser.name,
				p_cdgre: "",
				p_cdpcn: oFormData["CDPCN"] || "",
				p_ctgra: oFormData["sKeyCateg"] || "",
				p_emba: oFormData["CDEMB"] ? "E" : "G",
				p_empeb: oFormData["CDEMP"] || "",
				p_fefin: formatter.setFormatDateYYYYMMDD(sFechaFin),
				p_feini: formatter.setFormatDateYYYYMMDD(sFechaInicio),
				p_grueb: "",
				p_option: [],
				p_options: [],
				p_tcons: iEmpresaIndex === 0 ? "A" : "P",
				p_zcdzar: oFormData["ZCDZAR"] || ""
			  };
			if(sOptionsLowValue){
				param.p_options = [
					{
						cantidad: "10",
						control: "INPUT",
						key: sOptionsKeys,
						valueHigh: "",
						valueLow: sOptionsLowValue
					}
				];
			}
			oService.url = this.getHostService() +  "/api/sistemainformacionflota/PescaCompetenciaProduce";
			oService.serviceName = "Pesca de competencia produce";
			oService.param = param;
			this._getDataMainTable(oService,iEmpresaIndex);
			this._bindRowsTable(sPath);
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

		onOpenZonas: async function(oEvent){
			var oButton = oEvent.getSource(),
			oView = this.getView(),
			sTableId = oView.byId("table");
			// Popup.setWithinArea(oView.getId());
			// Create popover
			if (!this._pListPopover) {
				this._pListPopover = await Fragment.load({
					name: "com.tasa.pcomptproduce.view.fragments.PuertosZona",
					controller: this
				});
				oView.addDependent(this._pListPopover);
			}
			this._pListPopover.bindElement("/oDataApp");
			this._pListPopover.openBy(oButton);
		},

		onShowPuertos:function(){
			let sCod = "0000",
			oTable = this.getView().byId("table"),
			aColumns = oTable.getColumns(),
			iColLength = aColumns.length;

			this._destroyColumns();
			this._buildPuertosColumns(sCod);
			this._pListPopover.close();
		},

		onHidePuertos:function(){
			let oModel = this.getModel(),
			aColumnZonas = oModel.getProperty("/oDataApp/str_zlt"),
			oViewModel = this.getModel("worklistView"),
			sKey = oViewModel.getProperty("/indicadorPropiedad"),
			sPath1 = this._setPathIndPropiedad(sKey).sPath1,
			sPath2 = this._setPathIndPropiedad(sKey).sPath2;
			this._buildColumns(aColumnZonas,sPath1,sPath2);
			this._destroyColumnsPuertos();
			this._pListPopover.close();
		},

		onSeleccionarPuerto:function(oEvent){
			let oContext = oEvent.getSource().getBindingContext(),
			oObject = oContext.getObject(),
			oModel = oContext.getModel(),
			sCodZona = oObject.CDZLT;
			oModel.setProperty("/selectedCodZona",sCodZona);
			this._pListPopover.close();
			this._buildPuertosColumns(sCodZona);
		},

		/**
		 * Event handler to Indicador de propiedad
		 * @param {event} oEvent 
		 */
		onSelectioIndPropiedad:function(oEvent){
			let oIndPropItem = oEvent.getParameter("item"),
			sKey = oIndPropItem.getKey(),
			oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			aColumnZonas = oModel.getProperty("/oDataApp/str_zlt"),
			iIndexDelete = aColumnZonas.findIndex(col => col.CDZLT === "0000"),
			aTableData = oModel.getProperty("/tableRows"),
			sPath = "/tableRows",
			sPath1 = this._setPathIndPropiedad(sKey).sPath1,
			sPath2 = this._setPathIndPropiedad(sKey).sPath2,
			sCodZona = oModel.getProperty("/selectedCodZona");
			// oViewModel.setProperty("/indicadorPropiedad",sKey)
			if(iIndexDelete > 0) aColumnZonas.splice(iIndexDelete,1);
			// this._bindRowsTable(sPath)
			this._buildColumns(aColumnZonas,sPath1,sPath2);
			this._buildPuertosColumns(sCodZona);
			// aTableData = this._calcularColumnasTotales(aTableData,sPath1,sPath2);
			
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

		/**
		 * Internal helper method to get data for application
		 * @param {object} oService 
		 * @param {number} iEmpresaIndex 
		 */
		_getDataMainTable: async function(oService,iEmpresaIndex){
			let oData = await this.getDataService(oService),
			oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			aTableRows=[];
			if(oData){
				oModel.setProperty("/oDataApp", oData);
				// crear estrucutura de empresa armador y receptor
				aTableRows = this._getDataEmpresa(oData);
				// Data para puertos
				aTableRows = this._getDataPuertos(aTableRows);
				// calcular Columnas Totales
				aTableRows = this._calcularColumnasTotales(aTableRows,"CNPDS","CNDSH");
				// calcular filas de totales
				aTableRows = this._calcularFilasTotales(aTableRows);
				oModel.setProperty("/tableRows", aTableRows);
				// mostrar el boton de zonas
				oViewModel.setProperty("/bMostrarPuertos",true);
			}
		},

		/**
		 * Internal helper method for binding main table
		 * @param {string} sPath 
		 */
		_bindRowsTable:function(sPath){
			let oTable = this.getView().byId("table"),
			that = this;
			oTable.bindRows({
				path:sPath,
				events:{
					change: function(oEvent){
						let iLastStartIndex = oEvent.getSource().iLastStartIndex;
						if(iLastStartIndex !== undefined){
							that.onRowsDataChange(oEvent);
						}
					}
				}
			})
		},

		/**
		 * Internal helper method to build dynamic columns from sap.ui.table
		 * @param {Array} aColumns 
		 * @param {string} sPath1 
		 * @param {string} sPath2 
		 */
		_buildColumns:function(aColumnZonas,sPath1,sPath2){
			this._destroyColumns();
			let oTable = this.getView().byId("table"),
			aColumnHeader;
			this.colZonasLength = aColumnZonas.length * 3;
			
			aColumnZonas.forEach(oCol => {
				aColumnHeader = this.getTableColumn(oCol.DSZLT,oCol.CDZLT,sPath1,sPath2);
				aColumnHeader.forEach(oColHeader => {
					oTable.addColumn(oColHeader);
				});
			});
		},

		_buildPuertosColumns:function(sCodZona){
			this._destroyColumnsPuertos();
			let oTable = this.getView().byId("table"),
			oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			sKey = oViewModel.getProperty("/indicadorPropiedad"),
			aPuertos = oModel.getProperty("/oDataApp/str_pto"),
			aPuertosZona,
			sPath1 = this._setPathIndPropiedad(sKey).sPath1,
			sPath2 = this._setPathIndPropiedad(sKey).sPath2,
			aColumnHeader;
			
			if(sCodZona === "0000"){
				aPuertos.forEach(oCol => {
					// sPath1 = oCol.CDZLT+"/"+oCol.CDPTO+"/"+
					aColumnHeader = this.getPuertosColumn(oCol.DSPTO,oCol.CDZLT,oCol.CDPTO,sPath1,sPath2);
					aColumnHeader.forEach(oColHeader => {
						oTable.addColumn(oColHeader);
					});
				});
				this.aColPuertosLength = aPuertos.length*2;
			}else{
				aPuertosZona = aPuertos.filter(elem => elem.CDZLT === sCodZona);
				aPuertosZona.forEach(oCol => {
					aColumnHeader = this.getPuertosColumn(oCol.DSPTO,oCol.CDZLT,oCol.CDPTO,sPath1,sPath2);
					aColumnHeader.forEach(oColHeader => {
						oTable.addColumn(oColHeader);
					}); 
				});
				this.aColPuertosLength = aPuertosZona.length*2;
			}
		},

		/**
		 * Internal helper method to destroy dynamic columns
		 */
		_destroyColumns:function(){
			let oTable = this.getView().byId("table"),
			aColumns = oTable.getColumns(),
			iLimitInf = aColumns.length - this.colZonasLength - this.aColPuertosLength,
			aRows = oTable.getRows();
			for (let i = aColumns.length-1; i > iLimitInf - 1; i--) {
				oTable.removeColumn(aColumns[i]);
			}
			aRows.forEach(oRow => {
				oRow.getCells()[0].setActive(true);
				oRow.getCells()[0].setState("Information");
			});
			this.colZonasLength = 0;
			this.aColPuertosLength = 0;
		},

		_destroyColumnsPuertos:function(){
			let oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			oTable = this.getView().byId("table"),
			aColumns = oTable.getColumns(),
			iLimitInf = aColumns.length - this.aColPuertosLength;
			if(this.aColPuertosLength === 0) return;
			for (let i = aColumns.length-1; i > iLimitInf-1; i--) {
				oTable.removeColumn(aColumns[i]);
			};
			// oViewModel.setProperty("/bMostrarPuertos",false);
			this.aColPuertosLength = 0;
		},

		/**
		 * Internal method for build Armador's and Receptor's structure
		 * @param {object} oData 
		 */
		_getDataEmpresa:function(oData){
			let aEmpresaData = oData.str_gre,
			aStrPgeData = oData.str_pge;
			if(aEmpresaData.length > 0 && aStrPgeData.length > 0){
				aEmpresaData.forEach(row => {
					aStrPgeData.forEach(rowPge => {
						if(row.CDGRE === rowPge.CDGRE){
							row[rowPge.CDZLT] = rowPge
						}
					});
				});
			};
			return aEmpresaData; 
		},

		/**
		 * Internal method for build Puertos' structure
		 * @param {object} oData 
		 * @returns 
		 */
		_getDataPuertos:function(aTableData){
			let oModel = this.getModel(),
			aStrZplData = oModel.getProperty("/oDataApp/str_zpl"),
			aKeys = []; 
			if(aTableData.length > 0 && aStrZplData.length > 0){
				aTableData.forEach(row => {
					aKeys = Object.keys(row)
					aStrZplData.forEach(rowZpl => {
						if(row.CDGRE === rowZpl.CDGRE){
							aKeys.forEach(key => {
								if(key === rowZpl.CDZLT){
									row[rowZpl.CDZLT][rowZpl.CDPTO] = rowZpl;
								}
							})
						}
					});
				});
			};
			return aTableData;
		},

		_calcularColumnasTotales:function(aTableRows,/*sPath1,sPath2*/){
			let oModel = this.getModel(),
			aZonas = oModel.getProperty("/oDataApp/str_zlt"),
			aKeys = ["D","P","T"],
			sPath1,
			sPath2,
			iPescaTotal,
			iNDesTotal,
			iCocPescaNdes;

			aKeys.forEach(key => {
				iPescaTotal = 0;
				iNDesTotal = 0;
				iCocPescaNdes = 0;
				if (key === "P"){
					sPath1 = "CNDPR";
					sPath2 = "DSHPR";
				} else if(key === "T") {
					sPath1 = "CPDTR";
					sPath2 = "DSHTR";
				} else {
					sPath1 = "CNPDS";
					sPath2 = "CNDSH";
				}
				aTableRows.forEach(row => {
					iPescaTotal = 0;
					iNDesTotal = 0;
					iCocPescaNdes = 0;
					aZonas.forEach(zona => {
						if(row[zona.CDZLT]){
							iPescaTotal += row[zona.CDZLT][sPath1];
							iNDesTotal += row[zona.CDZLT][sPath2];
						}
					});
					row["pescaTotal"+key] = iPescaTotal;
					row["nDesTotal"+key] = iNDesTotal;
					if(iNDesTotal>0) iCocPescaNdes = iPescaTotal/iNDesTotal;
					row["nCocPescaNdes"+key] = iCocPescaNdes;
				});
			});
			return aTableRows;
		},

		_calcularFilasTotales:function(aTableRows){
			let oModel = this.getModel(),
			aStrZlt = oModel.getProperty("/oDataApp/str_zlt"),
			aPuertos = oModel.getProperty("/oDataApp/str_pto"),
			oTotals={};
			if(aTableRows.length > 0){
				// calculamos totales
				let aKeys = Object.keys(aTableRows[0]),
				sTotal,
				sPescaTotal,
				sEmbaTotal,
				iTotCNPDS,
				iTotNDes,
				iTotCNDPR,
				iTotDSHPR,
				iTotCPDTR,
				iTotDSHTR;

				aKeys.forEach(key => {
					sTotal = 0;
					sPescaTotal = 0;
					iTotCNPDS = 0;
					sEmbaTotal = 0;
					iTotNDes = 0;
					if(key === "DSGRE") {
						sTotal = "Total";
					}else {
						sTotal = aTableRows.reduce( (acc , obj) => {
							return acc + obj[key]
						},0);
					}
					oTotals[key] = sTotal;
				});

				aStrZlt.forEach(zona => {
					iTotCNPDS = 0;
					iTotNDes = 0;
					iTotCNDPR = 0;
					iTotDSHPR = 0;
					iTotCPDTR = 0;
					iTotDSHTR = 0;

					aTableRows.forEach(row => {
						if(row[zona.CDZLT]) iTotCNPDS += row[zona.CDZLT].CNPDS;
						if(row[zona.CDZLT]) iTotNDes += row[zona.CDZLT].CNDSH;

						if(row[zona.CDZLT]) iTotCNDPR += row[zona.CDZLT].CNDPR;
						if(row[zona.CDZLT]) iTotDSHPR += row[zona.CDZLT].DSHPR;

						if(row[zona.CDZLT]) iTotCPDTR += row[zona.CDZLT].CPDTR;
						if(row[zona.CDZLT]) iTotDSHTR += row[zona.CDZLT].DSHTR;

					});
					oTotals[zona.CDZLT] = {}
					oTotals[zona.CDZLT].CNPDS = iTotCNPDS;
					oTotals[zona.CDZLT].CNDSH = iTotNDes;

					oTotals[zona.CDZLT].CNDPR = iTotCNDPR;
					oTotals[zona.CDZLT].DSHPR = iTotDSHPR;

					oTotals[zona.CDZLT].CPDTR = iTotCPDTR;
					oTotals[zona.CDZLT].DSHTR = iTotDSHTR;
				});

				aPuertos.forEach( port => {
					iTotCNPDS = 0;
					iTotNDes = 0;
					iTotCNDPR = 0;
					iTotDSHPR = 0;
					iTotCPDTR = 0;
					iTotDSHTR = 0;
					aTableRows.forEach(row => {
						if(row[port.CDZLT]){
							if(row[port.CDZLT][port.CDPTO]) iTotCNPDS += row[port.CDZLT][port.CDPTO].CNPDS;
						}
						if(row[port.CDZLT]){
							if(row[port.CDZLT][port.CDPTO]) iTotNDes += row[port.CDZLT][port.CDPTO].CNDSH;
						}
						if(row[port.CDZLT]){
							if(row[port.CDZLT][port.CDPTO]) iTotCNDPR += row[port.CDZLT][port.CDPTO].CNDPR;
						}
						if(row[port.CDZLT]){
							if(row[port.CDZLT][port.CDPTO]) iTotDSHPR += row[port.CDZLT][port.CDPTO].DSHPR;
						}
						if(row[port.CDZLT]){
							if(row[port.CDZLT][port.CDPTO]) iTotCPDTR += row[port.CDZLT][port.CDPTO].CPDTR;
						}
						if(row[port.CDZLT]){
							if(row[port.CDZLT][port.CDPTO]) iTotDSHTR += row[port.CDZLT][port.CDPTO].DSHTR;
						}

						oTotals[port.CDZLT][port.CDPTO] = {}
						oTotals[port.CDZLT][port.CDPTO].CNPDS = iTotCNPDS;
						oTotals[port.CDZLT][port.CDPTO].CNDSH = iTotNDes;

						oTotals[port.CDZLT][port.CDPTO].CNDPR = iTotCNDPR;
						oTotals[port.CDZLT][port.CDPTO].DSHPR = iTotDSHPR;

						oTotals[port.CDZLT][port.CDPTO].CPDTR = iTotCPDTR;
						oTotals[port.CDZLT][port.CDPTO].DSHTR = iTotDSHTR;
					});
				});

				aTableRows.push(oTotals);
				// aStrGreData.push({
				// 	DSGRE:"Total",
				// 	CNPDS:"1560.56"
				// })
				aTableRows.push({
					DSGRE:"Distr. Nacional (%)",
					CNPDS:"1560.56"
				})
				aTableRows.push({
					DSGRE:"DISTR. TASA(%)",
					CNPDS:"1560.56"
				})

			}

			return aTableRows;
		}, 

		_formatTotales:function(iTotalRows){
			let oTable = this.getView().byId("table"),
			aRows = oTable.getRows(),
			iRowsLength = aRows.length,
			oControl,oControl1,oControl2;
			if(iTotalRows > 0){
				if(iTotalRows < iRowsLength){
					oControl = aRows[iTotalRows-1].getCells()[0];
					oControl1 = aRows[iTotalRows-2].getCells()[0];
					oControl2 = aRows[iTotalRows-3].getCells()[0];
				}else{
					oControl = aRows[iRowsLength-1].getCells()[0];
					oControl1 = aRows[iRowsLength-2].getCells()[0];
					oControl2 = aRows[iRowsLength-3].getCells()[0];
				}
				oControl.setActive(false);
				oControl1.setActive(false);
				oControl2.setActive(false);

				oControl.setState("Error");
				oControl1.setState("Success");
				oControl2.setState("None");
			}

		}

	});
});
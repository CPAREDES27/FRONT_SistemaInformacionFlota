sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (
	BaseController, 
	JSONModel, 
	formatter, 
	Filter, 
	FilterOperator) {
	"use strict";

	const HOST = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";

	return BaseController.extend("com.tasa.pdescargada.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			// let currentDate = new Date();
			// let firstDateOfMonth = new Date();
			// firstDateOfMonth.setDate(1);

			// this.getDataTable(firstDateOfMonth, currentDate);
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
		onUpdateFinished: function (oEvent) {
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
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},


		onSearch: function (oEvent) {
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
					aTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		onCleanSearch:function(){
			this._resetControls();
		},

		onSearchPescaDescargada: async function(oEvent){
			this.iCount = 0;
			this.iCountService = 1;
			this._resetControls();
			let oService = {},
			oModel = this.getModel(),
			aItems = [],
			sFides = oModel.getProperty("/help/dateFrom"),
			sFfdes = oModel.getProperty("/help/dateTo"),
			sUrl = HOST + "/api/sistemainformacionflota/PescaDescargadaDiaResum",
			body = {
				fieldstr_pta: [],
				fielstr_dsd: [],
				fielstr_dsddia: [],
				fielstr_dsdtot: [],
				p_ffdes: this.formatter.formatDateYYYYMMDD(sFfdes),
				p_fides: this.formatter.formatDateYYYYMMDD(sFides),
				p_user: ""
			};

			oService.PATH = sUrl;
			oService.param = body;
			let oDataPescaDesc = await this.getDataService(oService);
			if(oDataPescaDesc){
				let aPlantas = oDataPescaDesc.str_pta,
				descargas = oDataPescaDesc.str_dsd,
				descargasDias = oDataPescaDesc.str_dsddia,
				totalesDescargas = oDataPescaDesc.str_dsdtot;

				this._buildTableItems(oDataPescaDesc);
				// aPlantas.forEach(oPlanta => {
				// 	aColumns.push({
				// 		header:oPlanta.DESCR
				// 	});
				// });
				// aColumns.forEach(aCol=>{
				// 	aItems.push({
				// 		FIDES:
				// 	});
				// });
				// oModel.setProperty("/dataPescaDesc",oDataPescaDesc);
				// oModel.setProperty("/columns",aColumns);
			}
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
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ProductID")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		_resetControls:function(){
			let oModel = this.getModel(),
			aColumns = [
				{
					id:"FIDES",
					header:"Fecha",
					footer:"Total",
					align:"Begin"
				},
				{
					id:"CNPDS",
					header:"Pesca",
					footer:"",
					align:"End",
					styleClass:"colPesca"
				},
				{
					id:"CORREL",
					header:"Días",
					align:"End",
					styleClass:"colDias"
				},
				{
					id:"PROMCNPDS",
					header:"Promedio",
					align:"End",
					styleClass:"colProm"
				}
			];
			oModel.setProperty("/columns",aColumns);
			oModel.setProperty("/items",[]);
			oModel.setProperty("/plantas",[]);
			oModel.refresh(true);
		},

		_buildTableItems:function(oData){
			let oTable = this.getView().byId("table"),
			aPlantas = oData.str_pta,
			aItems = oData.str_dsddia,
			aTotal = oData.str_dsdtot,
			aPlantasData = oData.str_dsd,
			oModel = this.getModel(),
			aColumns = oModel.getProperty("/columns"),
			aCells = [],
			aPlantasGraph=[],
			oColumnListItem = new sap.m.ColumnListItem({
				cells:aCells
			});

			aPlantas.forEach(oPlant => {
				aColumns.push({
					id:oPlant.CDPTA,
					header:oPlant.DESCR,
					align:"End",
				});
			});
			aColumns.forEach(oCol => {
				aTotal.forEach(total=>{
					if(total.CDPTA === oCol.id){
						oCol.footer = total.TOTALCNPDS
					}else if(oCol.id === "CNPDS"){
						oCol.footer = total.TOTALCNPDS
					}
				});
			});
			aItems.forEach(oItem=>{
				aPlantasData.forEach(oPlant => {
					if(oItem.FIDES ===  oPlant.FIDES){
						oItem.CDPTA = oPlant.CDPTA;
						oItem[`${oPlant.CDPTA}-CNPDS`] = oPlant.CNPDS;
					}
					
				});
			});

			aPlantas.forEach(oPlant=>{
				aTotal.forEach(total=>{
					if(total.CDPTA===oPlant.CDPTA){
						aPlantasGraph.push({
							label:oPlant.DESCR ,
							value:total.TOTALCNPDS
						})
					}
				});
			});
			console.log(aPlantasGraph);
			oModel.setProperty("/columns",aColumns);
			oModel.setProperty("/items",aItems);
			oModel.setProperty("/plantas",aPlantasGraph);

			// oTable.bindAggregation("items",{
			// 	path:'/dataPescaDesc',
			// 	template:oColumnListItem
			// });
		},
		
		createItems:function(sId,oContext){
			let oObject = oContext.getObject(),
			oModel = oContext.getModel(),
			aColumns = oModel.getProperty("/columns"),
			aKeys = Object.keys(oObject),
			aCells = [],
			sPath;
			aColumns.forEach(oCol=>{
				sPath = oCol.id + "-CNPDS";
				if(isNaN(Number(oCol.id))) sPath = oCol.id;
				aCells.push(new sap.m.Text({
					text:{
						path:sPath,
						formatter:(sPath)=>{
							if(isNaN(Number(sPath))){
								return sPath;
							} else {
								if(oCol.id === "PROMCNPDS"){
									return this.formatter.formatFloat2(sPath);
								}else{
									return this.formatter.formatFloat(sPath);
								}
							}
						}
					}
				}));
			});
			return new sap.m.ColumnListItem({
				cells:aCells
			})
		}
		// buscarPescaDescargada: function () {
		// 	let fechaInicio = this.byId("dateRangePescaDescargada").getDateValue();
		// 	let fechaFin = this.byId("dateRangePescaDescargada").getSecondDateValue();
		// 	this.getDataTable(fechaInicio, fechaFin);
		// },
		// getDataTable: async function (fechaInicio, fechaFin) {
		// 	let listPescaDescargada = await this.getListPescaDescargadaDiaResum(fechaInicio, fechaFin);

		// 	if (listPescaDescargada) {
		// 		let plantas = listPescaDescargada.str_pta;
		// 		let descargas = listPescaDescargada.str_dsd;
		// 		let descargasDias = listPescaDescargada.str_dsddia;
		// 		let totalesDescargas = listPescaDescargada.str_dsdtot;

		// 		//Copiar un elemento de la lista de descargas por días
		// 		let totales = { ...descargasDias[0] };

		// 		// Adición de campos dinámicos de las plantas
		// 		let totalesDescargasDias = descargasDias.map(descDias => {
		// 			const fecha = descDias.FIDES;
		// 			descargas.filter(desc => desc.FIDES === fecha).forEach(desc => {
		// 				descDias[`CNPDS${desc.CDPTA}`] = desc.CNPDS;
		// 			});

		// 			return descDias;
		// 		});

		// 		//Adicionar la fila de totales
		// 		totalesDescargas.filter(totalesDesc => totalesDesc.CDPTA !== 'TT').forEach(totalesDesc => {
		// 			totales[`CNPDS${totalesDesc.CDPTA}`] = totalesDesc.TOTALCNPDS;
		// 		});
		// 		totales.CNPDS = totalesDescargas.find(totalesDesc => totalesDesc.CDPTA === 'TT').TOTALCNPDS;
		// 		totales.FIDES = null;
		// 		totales.CORREL = null;
		// 		totales.PROMCNPDS = null;

		// 		//Unir los totales de descargas por días con las plantas
		// 		let totalesDescargasDiasPlantas = totalesDescargas.map(totalDescarga => {
		// 			const planta = plantas.find(planta => planta.CDPTA === totalDescarga.CDPTA);
		// 			if (planta) {
		// 				return {
		// 					planta: planta.DESCR,
		// 					descarga: totalDescarga.TOTALCNPDS
		// 				}
		// 			}
		// 		}).filter(totalDescargaDiaPlanta => totalDescargaDiaPlanta !== undefined);


		// 		totalesDescargasDias.push(totales);

		// 		this.getModel().setProperty("/STR_DSD", totalesDescargasDias);
		// 		this.getModel().setProperty("/STR_TOTALES_DIAS", descargasDias);
		// 		this.getModel().setProperty("/STR_TOTALES_PLANTA", totalesDescargasDiasPlantas);
		// 	}
		// }

	});
});
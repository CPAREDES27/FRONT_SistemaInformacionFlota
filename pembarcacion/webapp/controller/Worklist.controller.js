sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
	"sap/ui/core/BusyIndicator"
], function (BaseController,
	JSONModel,
	formatter,
	Filter,
	FilterOperator,
	exportLibrary,
	Spreadsheet,
	BusyIndicator) {
	"use strict";
	var EdmType = exportLibrary.EdmType;
	const HOST = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
	const HOST2 = "https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com";

	return BaseController.extend("com.tasa.pembarcacion.controller.Worklist", {

		formatter: formatter,
		dataTableKeys: ['NMEMB', 'CPPMS', 'CPRNC', 'CAVNC', 'CPRSU', 'CAVSU', 'CNDCN', 'CNDSU', 'CNDHD', 'CNDTO', 'DIPCN', 'DIPSU', 'DIPHD', 'DSPSU', 'DSPHD', 'DIVED', 'TOTDI', 'DIFAL', 'RENEM'],

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
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				// valores iniciales para Inputs temporada/fecha
				enabledTempInput: true,
				enabledDateInput: false,
				// valores iniciales para columnas
				visibleColCuota: true,
				visibleColTM:false,
				visibleColDias:true
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});

			//Llenado de selectores
			// this.loadData();
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
		 * metodo para habilitar busqueda por temporada/fecha
		 * @param {event} oEvent 
		 */
		onSelectRadioButton:function(oEvent){
			let oSelectedIndex = oEvent.getParameter("selectedIndex"),
			oViewModel = this.getModel("worklistView"),
			oModel = this.getModel(); 
			if(oSelectedIndex===0) { // seleccion de temporada
				oViewModel.setProperty("/enabledTempInput",true);
				oViewModel.setProperty("/enabledDateInput",false);
				oViewModel.setProperty("/visibleColCuota",true);
				oViewModel.setProperty("/visibleColTM",false);
				oViewModel.setProperty("/visibleColDias",true);

				oModel.setProperty("/formSearch/fecha","");
				oModel.setProperty("/PESCAS_EMBARCACION",[]);
				
			}else{
				oViewModel.setProperty("/enabledTempInput",false);
				oViewModel.setProperty("/enabledDateInput",true);
				oViewModel.setProperty("/visibleColCuota",false);
				oViewModel.setProperty("/visibleColTM",true);
				oViewModel.setProperty("/visibleColDias",false);


				oModel.setProperty("/formSearch/startDate",null);
				oModel.setProperty("/formSearch/endDate",null);
				oModel.setProperty("/formSearch/tempDesc",null);
				oModel.setProperty("/PESCAS_EMBARCACION",[]);
			}
				
		},

		/**
		 * se llama Ayuda de busqueda de temporadas
		 * @param {event} oEvent 
		 */
		onSearchHelp:function(oEvent){
			let that = this,
			oView = this.getView(),
			oModel = this.getModel(),
			sUrl = HOST2 + "/10f4c59e-35e6-4d6a-88ef-e0267faac0ab.AyudasBusqueda.comtasabusqtemporada-1.0.0",
			nameComponent = "com.tasa.busqtemporada",
			idComponent = "com.tasa.busqtemporada";

			if(!that.DialogComponent){
				that.DialogComponent = new sap.m.Dialog({
					title:"Búsqueda Temporada de Pesca Cuota Nacional",
					icon:"sap-icon://search",
					state:"Information",
					endButton:new sap.m.Button({
						icon:"sap-icon://decline",
						text:"Cerrar",
						type:"Reject",
						press:function(oEvent){
							that.onCloseDialog(oEvent);
						}.bind(that)
					})
				});
				oView.addDependent(that.DialogComponent);
				oModel.setProperty("/idDialogComp",that.DialogComponent.getId());
			}

			let compCreateOk = function(){
				BusyIndicator.hide()
			}
			if(that.DialogComponent.getContent().length===0){
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
				that.DialogComponent.addContent(oContainer);
			}

			that.DialogComponent.open();

		},

		onCloseDialog:function(oEvent){
			oEvent.getSource().getParent().close();
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

		onExport: function () {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this._oTable) {
				this._oTable = this.byId('table');
			}

			oTable = this._oTable;
			oRowBinding = oTable.getBinding('rows');
			aCols = this._createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level'
				},
				dataSource: oRowBinding,
				fileName: 'Table export sample.xlsx',
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},

		/**
		 * Metodo que consume servicio para para tabla
		 */
		onPescaSearch: async function(){
			let oModel = this.getModel(),
			sStartDate = oModel.getProperty("/formSearch/startDate"),
			sEndDate = oModel.getProperty("/formSearch/endDate"),
			sDateRange = oModel.getProperty("/formSearch/fecha"),
			sTipEmb = oModel.getProperty("/formSearch/tipoEmb"),
			sCodPort = oModel.getProperty("/formSearch/codPort"),
			oService={};

			sStartDate ? sStartDate=formatter.setFormatDateYYYYMMDD(sStartDate) : "";
			sEndDate ? sEndDate=formatter.setFormatDateYYYYMMDD(sEndDate) : "";

			if(!sStartDate) sStartDate=formatter.setFormatDateYYYYMMDD(sDateRange.split("-")[0].trim());
			if(!sEndDate) sEndDate=formatter.setFormatDateYYYYMMDD(sDateRange.split("-")[1].trim());

			oService.PATH = HOST+"/api/sistemainformacionflota/PescaPorEmbarcacion";
			oService.param = {
				fieldstr_pem: [],
				p_cdpcn: sDateRange ? "" : sCodPort,
				p_cdtem: sTipEmb,
				p_fcfin: sEndDate,
				p_fcini: sStartDate,
				p_user: ""
			};
			this.iCount=0;
			this.iCountService=1;
			let oPescData = await this.getDataService(oService);

			if(oPescData){
				oModel.setProperty("/PESCAS_EMBARCACION",oPescData["str_pem"])
			}
		},

		/**
		 * Limpiar contenido de los controles de busqueda
		 */
		onClearSearch:function(){
			let oModel = this.getModel();
			oModel.setProperty("/formSearch",{});
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
		loadData: async function () {
			const listDomNames = ["TIPOEMBARCACION", "OPCIONFECHA_RPEB"];
			let listDominios = await this.getDominios(listDomNames);
			let listTemporadas = await this.getTemporadas();

			//Llenado de selectores
			if (listDominios) {
				const listTiposEmbarcacion = listDominios.data.find(dom => dom.dominio === "TIPOEMBARCACION").data;
				const listOpcionFecha = listDominios.data.find(dom => dom.dominio === "OPCIONFECHA_RPEB").data;

				this.getModel().setProperty("/TIPOS_EMBARCACION", listTiposEmbarcacion);
				this.getModel().setProperty("/OPCIONES_FECHA", listOpcionFecha);
			}

			//Llenado de sugerencia de temporadas
			if (listTemporadas) {
				//Ordenar temporadas por fecha fin
				listTemporadas.data.sort((a, b) => {
					return -(this.formatter.getDateFromString(a.FHFTM) - this.formatter.getDateFromString(b.FHFTM));
				});
				//Establecer la primera temporada como seleccionada
				const mostRecentTemporada = listTemporadas.data[0];
				this.byId("txtTemporadas").setValue(mostRecentTemporada.CDPCN);
				this.byId("dateRangePescaEmbarcacion").setDateValue(this.formatter.getDateFromString(mostRecentTemporada.FHITM));
				this.byId("dateRangePescaEmbarcacion").setSecondDateValue(this.formatter.getDateFromString(mostRecentTemporada.FHFTM));

				this.getModel().setProperty("/SUGGESTION_TEMPORADAS", listTemporadas.data);
			}

			//Establecer la primera temporada como seleccionada

		},
		updateDateRange: function (oEvent) {
			const codTemporada = oEvent.getParameter('value');

			let temporada = this.getModel().getProperty("/SUGGESTION_TEMPORADAS").find(temp => temp.CDPCN === codTemporada);

			if (temporada) {
				const fechaInicio = this.formatter.getDateFromString(temporada.FHITM);
				const fechaFin = this.formatter.getDateFromString(temporada.FHFTM);

				this.byId("dateRangePescaEmbarcacion").setDateValue(fechaInicio);
				this.byId("dateRangePescaEmbarcacion").setSecondDateValue(fechaFin);
			}

			/* this.byId("dateRangePescaEmbarcacion").setDateValue(this.formatter.getDateFromString(mostRecentTemporada.FHITM));
			this.byId("dateRangePescaEmbarcacion").setSecondDateValue(this.formatter.getDateFromString(mostRecentTemporada.FHFTM)); */
		},
		buscarPescasPorEmbarcacion: async function () {
			const opcionFecha = this.byId("opcionFecha").getSelectedKey();
			const fechaInicial = this.byId("dateRangePescaEmbarcacion").getDateValue();
			const fechaFinal = this.byId("dateRangePescaEmbarcacion").getSecondDateValue();
			const temporada = opcionFecha === 'T' ? this.byId("txtTemporadas").getValue() : undefined;
			const tipoEmbarcacion = this.byId("tipoEmbarcacion").getSelectedKey();

			let result = await this.getListPescasEmbarcacion(temporada, tipoEmbarcacion, fechaInicial, fechaFinal);

			let listPescasEmbarcacion = result.str_pem;
			/**
			 * Calcular totales
			 */
			let totales = listPescasEmbarcacion.reduce((pemAcum, pem) => {
				return {
					CPRNC: pem.CPRNC + pemAcum.CPRNC,
					CAVNC: pem.CAVNC + pemAcum.CAVNC,
					CPRSU: pem.CPRSU + pemAcum.CPRSU,
					CAVSU: pem.CAVSU + pemAcum.CAVSU,
				}
			});

			listPescasEmbarcacion.push(totales);


			this.getModel().setProperty("/PESCAS_EMBARCACION", listPescasEmbarcacion);
		},
		_createColumnConfig: function () {
			var aCols = [];

			aCols.push({
				label: 'Embarcación',
				property: 'NMEMB',
				type: EdmType.String
			});

			aCols.push({
				label: 'CBOD',
				type: EdmType.Number,
				property: 'CPPMS',
				scale: 2
			});

			/**
			 * CUOTA
			 */
			aCols.push({
				label: 'Periodo',
				type: EdmType.Number,
				property: 'CPRNC',
				scale: 2
			});

			aCols.push({
				label: 'Avance(%)',
				type: EdmType.Number,
				property: 'CAVNC',
				scale: 2
			});

			aCols.push({
				label: 'Periodo',
				type: EdmType.Number,
				property: 'CPRSU',
				scale: 2
			});

			aCols.push({
				label: 'Avance(%)',
				type: EdmType.Number,
				property: 'CAVSU',
				scale: 2
			});

			/**
			 * Pesca TM
			 */
			aCols.push({
				label: 'Centro Norte',
				type: EdmType.Number,
				property: 'CNDCN',
				scale: 2
			});

			aCols.push({
				label: 'Sur',
				type: EdmType.Number,
				property: 'CNDSU',
				scale: 2
			});

			aCols.push({
				label: 'CHD',
				type: EdmType.Number,
				property: 'CNDHD',
				scale: 2
			});

			aCols.push({
				label: 'Total',
				type: EdmType.Number,
				property: 'CNDTO',
				scale: 2
			});

			/**
			 * Días de Pesca
			 */
			aCols.push({
				label: 'Centro Norte',
				type: EdmType.Number,
				property: 'DIPCN',
				scale: 2
			});

			aCols.push({
				label: 'Sur',
				type: EdmType.Number,
				property: 'DIPSU',
				scale: 2
			});

			aCols.push({
				label: 'CHD',
				type: EdmType.Number,
				property: 'DIPHD',
				scale: 2
			});

			aCols.push({
				label: 'Sin Pesca Sur',
				type: EdmType.Number,
				property: 'DSPSU',
				scale: 2
			});

			aCols.push({
				label: 'Sin Pesca CHD',
				type: EdmType.Number,
				property: 'DSPHD',
				scale: 2
			});

			aCols.push({
				label: 'Veda',
				type: EdmType.Number,
				property: 'DIVED',
				scale: 2
			});

			aCols.push({
				label: 'Total',
				type: EdmType.Number,
				property: 'TOTDI',
				scale: 2
			});

			/**
			 * Dias
			 */
			aCols.push({
				label: 'Faltantes',
				type: EdmType.Number,
				property: 'DIFAL',
				scale: 2
			});

			aCols.push({
				label: 'Rend(%)',
				type: EdmType.Number,
				property: 'RENEM',
				scale: 2
			});

			return aCols;
		}
	});
});
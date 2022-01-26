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

	return BaseController.extend("com.tasa.pembarcacion.controller.Worklist", {

		formatter: formatter,
		// dataTableKeys: ['NMEMB', 'CPPMS', 'CPRNC', 'CAVNC', 'CPRSU', 'CAVSU', 'CNDCN', 'CNDSU', 'CNDHD', 'CNDTO', 'DIPCN', 'DIPSU', 'DIPHD', 'DSPSU', 'DSPHD', 'DIVED', 'TOTDI', 'DIFAL', 'RENEM'],

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
				visibleTemp: true,
				visibleFecha:false,
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
				sTableId = oEvent.getParameter("id"),
				oModel = this.getModel(),
				oRowBinding = oTable.getBinding("rows"),
				iTotalItems = oRowBinding.getCount(),
				sTotalPagination;

			if(this.iTotalItems !== iTotalItems){
				this.iTotalItems = iTotalItems;
				
				// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("rows").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems-1]);
					// sTotalPagination = oModel.getProperty("/pagination/total")
					// this._addPagination(sTableId,sTotalPagination,1);
					if(!this.bFlag){
						this._calcularTotales(oRowBinding);
					}
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);

				console.log(oRowBinding.oList)

			}
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
			this.iTotalItems = 0;
			this.bFlag = false;
			oModel.setProperty("/PESCAS_EMBARCACION",[]);
			oModel.setProperty("/help",{});
			if(oSelectedIndex===0) { // seleccion de temporada
				oViewModel.setProperty("/enabledTempInput",true);
				oViewModel.setProperty("/enabledDateInput",false);
				oViewModel.setProperty("/visibleTemp",true);
				oViewModel.setProperty("/visibleFecha",false);
				oModel.setProperty("/help/ZCDZAR","001");
				
			}else{  // seleccion de fecha
				oViewModel.setProperty("/enabledTempInput",false);
				oViewModel.setProperty("/enabledDateInput",true);
				oViewModel.setProperty("/visibleTemp",false);
				oViewModel.setProperty("/visibleFecha",true);
			};
			oModel.setProperty("/help/tipoEmb","001");
			this._destroyControl("selectPage");
			this._destroyControl("vbox1");
			this._destroyControl("hbox1");
			this._destroyControl("hboxPagination");
				
		},

		/**
		 * se llama Ayuda de busqueda de temporadas
		 * @param {event} oEvent 
		 */
		onSearchHelp:function(oEvent){
			let oView = this.getView(),
			oModel = this.getModel(),
			oContainer = oModel.getProperty("/busqtemporada");

			if(!this.DialogComponentTemp){
				BusyIndicator.show(0);
				this.DialogComponentTemp = new sap.m.Dialog({
					title:"Búsqueda Temporada de Pesca Cuota Nacional",
					icon:"sap-icon://search",
					state:"Information",
					endButton:new sap.m.Button({
						icon:"sap-icon://decline",
						text:"Cerrar",
						type:"Reject",
						press:function(oEvent){
							this.onCloseDialog(oEvent);
						}.bind(this)
					})
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

			jQuery.sap.require("sap.ui.core.util.Export");
			jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");

			oTable.exportData({
				exportType: new sap.ui.core.util.ExportTypeCSV()
			})
			.saveFile()
			.always(function() {
				this.destroy();
			});

			aCols = this._createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level'
				},
				dataSource: oRowBinding,
				fileName: 'Pesca por embarcacion.xlsx',
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
		onPescaSearch: async function(sPage){
			let oModel = this.getModel(),
			oHelp = oModel.getProperty("/help"),
			oViewModel = this.getView().getModel("worklistView"),
			bEnabledTempInput = oViewModel.getProperty("/enabledTempInput"),
			sStartDate = oHelp.FHITM,
			sEndDate = oHelp.FHFTM,
			sCodPort = oHelp.CDPCN,
			sCodZona = oHelp.ZCDZAR,
			sDateRange = oModel.getProperty("/help/fecha"),
			sTipEmb = oModel.getProperty("/help/tipoEmb"),
			oService={};
			if(!sDateRange && !sStartDate){
				let sMessage = "rango de fechas";
				if(bEnabledTempInput) sMessage = "temporada"
				this.getMessageDialog("Warning","Ingrese "+sMessage);
				return;
			}

			sStartDate ? sStartDate=formatter.setFormatDateYYYYMMDD(sStartDate) : "";
			sEndDate ? sEndDate=formatter.setFormatDateYYYYMMDD(sEndDate) : "";

			if(!sStartDate) sStartDate=formatter.setFormatDateYYYYMMDD(sDateRange.split("-")[0].trim());
			if(!sEndDate) sEndDate=formatter.setFormatDateYYYYMMDD(sDateRange.split("-")[1].trim());

			oService.PATH = this.getHostService()+"/api/sistemainformacionflota/PescaPorEmbarcacion";
			oService.param = {
				fieldstr_pem: [],
				p_cdpcn: sDateRange ? "" : sCodPort,
				p_cdtem: sTipEmb,
				p_fcfin: sEndDate,
				p_fcini: sStartDate,
				p_pag: sPage || "1",
				p_user: ""
			};
			this.iCount=0;
			this.iCountService=1;
			let oPescData = await this.getDataService(oService);

			if(oPescData){
				oModel.setProperty("/PESCAS_EMBARCACION",oPescData["str_pem"]);
				let sTotalPagination = oPescData["p_totalpag"];
				oModel.setProperty("/pagination",{
					title:`Pag ${sPage} de ${sTotalPagination}`,
					total:sTotalPagination
				});
			}
		},

		/**
		 * Limpiar contenido de los controles de busqueda
		 */
		onClearSearch:function(){
			let oModel = this.getModel();
			oModel.setProperty("/help",{});
			oModel.setProperty("/help/ZCDZAR","001");
		},

		/**
		 * Event Handler for Temporadas Input
		 * @param {event} oEvent 
		 */
		onUpdateDateRange: function (oEvent) {
			// const codTemporada = oEvent.getParameter('value');

			// let temporada = this.getModel().getProperty("/SUGGESTION_TEMPORADAS").find(temp => temp.CDPCN === codTemporada);

			// if (temporada) {
			// 	const fechaInicio = this.formatter.getDateFromString(temporada.FHITM);
			// 	const fechaFin = this.formatter.getDateFromString(temporada.FHFTM);

			// 	this.byId("dateRangePescaEmbarcacion").setDateValue(fechaInicio);
			// 	this.byId("dateRangePescaEmbarcacion").setSecondDateValue(fechaFin);
			// }

			/* this.byId("dateRangePescaEmbarcacion").setDateValue(this.formatter.getDateFromString(mostRecentTemporada.FHITM));
			this.byId("dateRangePescaEmbarcacion").setSecondDateValue(this.formatter.getDateFromString(mostRecentTemporada.FHFTM)); */
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
		
		// buscarPescasPorEmbarcacion: async function () {
		// 	const opcionFecha = this.byId("opcionFecha").getSelectedKey();
		// 	const fechaInicial = this.byId("dateRangePescaEmbarcacion").getDateValue();
		// 	const fechaFinal = this.byId("dateRangePescaEmbarcacion").getSecondDateValue();
		// 	const temporada = opcionFecha === 'T' ? this.byId("txtTemporadas").getValue() : undefined;
		// 	const tipoEmbarcacion = this.byId("tipoEmbarcacion").getSelectedKey();

		// 	let result = await this.getListPescasEmbarcacion(temporada, tipoEmbarcacion, fechaInicial, fechaFinal);

		// 	let listPescasEmbarcacion = result.str_pem;
		// 	/**
		// 	 * Calcular totales
		// 	 */
		// 	let totales = listPescasEmbarcacion.reduce((pemAcum, pem) => {
		// 		return {
		// 			CPRNC: pem.CPRNC + pemAcum.CPRNC,
		// 			CAVNC: pem.CAVNC + pemAcum.CAVNC,
		// 			CPRSU: pem.CPRSU + pemAcum.CPRSU,
		// 			CAVSU: pem.CAVSU + pemAcum.CAVSU,
		// 		}
		// 	});

		// 	listPescasEmbarcacion.push(totales);


		// 	this.getModel().setProperty("/PESCAS_EMBARCACION", listPescasEmbarcacion);
		// },
		_createColumnConfig: function () {
			var aCols = [];

			// aCols.push({
			// 	label: 'Embarcación',
			// 	property: 'NMEMB',
			// 	type: EdmType.String
			// });

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
		},

		/**
		 * Pagination's methods
		 */
		_addPagination:function(idTable,sTotalPag,sPage){
			var oTable = this.getView().byId(idTable);
			var oContentHolder = oTable.getParent();

			this._destroyControl("selectPage");

			this._destroyControl("vbox1");
			var oVBox1 = new sap.m.VBox("vbox1", {
			});

			this._destroyControl("hbox1");
			var oHBox1 = new sap.m.HBox("hbox1", {
				justifyContent: "SpaceBetween",
				width: "100%"
			});

			this._destroyControl("hboxPagination");
			var oHBoxPagination = new sap.m.HBox("hboxPagination", {
				justifyContent: "Center",
				width: "75%"
			});

			oHBoxPagination.setWidth("");
			oHBox1.setJustifyContent("Center");
			oHBox1.addItem(oHBoxPagination);
			oVBox1.addItem(oHBox1);
			oContentHolder.addItem(oVBox1);

			this._generatePaginator(sTotalPag,sPage);
		},

		_generatePaginator:function(sTotalPag,sPage){
			var countPerPage = 10;

			this.oPagination.container = sap.ui.getCore().byId("hboxPagination");
			this.oPagination.container.destroyItems();
			this.oPagination.init({
				size: parseInt(sTotalPag) ,
				page: parseInt(sPage)||1,
				step: 5,
				// table: oTablex,
				// countTable: countTable,
				countPerPage: countPerPage,
				// tableData: aDataTable,
				// devicePhone: this._devicePhone,
				// deviceTablet: this._deviceTablet
				controller:this
			});
		},

		oPagination: {
			container: {},
			init: function (properties) {
				this.Extend(properties);
				this.Start();
			},

			Extend: function (properties) {
				properties = properties || {};
				this.size = properties.size || 1;
				this.page = properties.page || 1;
				this.step = properties.step || 5;
				// this.table = properties.table || {};
				// this.countTable = properties.countTable || 0;
				this.countPerPage = properties.countPerPage || 10;
				// this.tableData = properties.tableData || 10;
				// this.devicePhone = properties.devicePhone;
				// this.deviceTablet = properties.deviceTablet;
				this.controller = properties.controller;
			},

			Start: function () {
				this.container.destroyItems();
				var oSelect = new sap.m.Select("selectPage", {
					change: this.SelectChange.bind(this),
				});
				this.container.addItem(oSelect);

				this.AddNumber(1, this.size + 1);

				this.setFixedButtons();
				var aSelectItems = oSelect.getItems();

				for (var k = 0; k < aSelectItems.length; k++) {
					var item = aSelectItems[k];
					var r = item.getText();

					if (r === this.page.toString()) {
						oSelect.setSelectedItem(item);
					}
				}
			},

			AddNumber: function (s, f) {
				for (var i = s; i < f; i++) {
					sap.ui.getCore().byId("selectPage").addItem(
						new sap.ui.core.Item({
							key: i,
							text: i
						})
					);
				}
			},

			AddFirstNumber: function () {
				sap.ui.getCore().byId("selectPage").insertItem(
					new sap.ui.core.Item({
						key: 1,
						text: 1
					}, 2)
				);
			},
			AddLastNumber: function () {
				sap.ui.getCore().byId("selectPage").insertItem(
					new sap.ui.core.Item({
						key: this.size,
						text: this.size
					}, this.size - 3)
				);
			},
			SelectChange: function (oEvent) {
				this.page = parseInt(oEvent.getParameters().selectedItem.getText());
				this.Start();
				this.controller.onPescaSearch(this.page)
			},
			ClickNumber: function (oEvent) {
				this.page = parseInt(oEvent.getSource().getText());
				this.Start();
				this.controller.onPescaSearch(this.page)
			},

			ClickPrev: function () {
				this.page--;
				if (this.page < 1) {
					this.page = 1;
				}
				this.Start();
				this.controller.onPescaSearch(this.page)
			},

			ClickNext: function () {
				this.page++;
				if (this.page > this.size) {
					this.page = this.size;
				}
				this.Start();
				this.controller.onPescaSearch(this.page)
			},

			ClickFirst: function () {
				this.page = 1;
				if (this.page < 1) {
					this.page = 1;
				}
				this.Start();
				this.controller.onPescaSearch(this.page)
			},

			ClickLast: function () {
				this.page = this.size;
				if (this.page > this.size) {
					this.page = this.size;
				}
				this.Start();
				this.controller.onPescaSearch(this.page)
			},

			setFixedButtons: function (e) {
				// if (this?.devicePhone || this?.deviceTablet) {
					var oButton = new sap.m.Button({
						icon: "sap-icon://close-command-field",
						type:"Transparent",
						press: this.ClickFirst.bind(this)
					});
					this.container.insertItem(oButton, 0);

					var oButton = new sap.m.Button({
						icon: "sap-icon://navigation-left-arrow",
						type:"Transparent",
						press: this.ClickPrev.bind(this)
					});

					this.container.insertItem(oButton, 1);

					oButton = new sap.m.Button({
						icon: "sap-icon://navigation-right-arrow",
						type:"Transparent",
						press: this.ClickNext.bind(this)
					});
					this.container.insertItem(oButton, this.size + 2);

					var oButton = new sap.m.Button({
						icon: "sap-icon://open-command-field",
						type:"Transparent",
						press: this.ClickLast.bind(this)
					});
					this.container.insertItem(oButton, this.size + 3);
				// }
				// else {

				// 	var oButton = new sap.m.Button({
				// 		text: "First",
				// 		press: this.ClickFirst.bind(this)
				// 	});
				// 	this.container.insertItem(oButton, 0);

				// 	oButton = new sap.m.Button({
				// 		text: "Next",
				// 		press: this.ClickNext.bind(this)
				// 	});
				// 	this.container.insertItem(oButton, 1);

				// 	oButton = new sap.m.Button({
				// 		text: "Previous",
				// 		press: this.ClickPrev.bind(this)
				// 	});
				// 	this.container.insertItem(oButton, this.size + 2);

				// 	oButton = new sap.m.Button({
				// 		text: "Last",
				// 		press: this.ClickLast.bind(this)
				// 	});
				// 	this.container.insertItem(oButton, this.size + 3);
				// }
			}
		},
		_destroyControl: function (id) {
			let oControl = this.getView().byId(id);
			if (oControl !== undefined) oControl.destroy();

			oControl = sap.ui.getCore().byId(id);
			if (oControl !== undefined) oControl.destroy();
		},


		_calcularTotales:function(oRowBinding){
			let aList = oRowBinding.oList,
			oModel = this.getModel(),
			aTableData = oModel.getProperty("/PESCAS_EMBARCACION"),
			oLastRow={},
			aKeys=Object.keys(aList[0]),
			sTotal;

			aKeys.forEach(key=>{
				sTotal = 0;
				if(key && key !== "NMEMB") {
					sTotal = aTableData.reduce((sum,current)=>{
						return sum + current[key];
					},0);
				}
				oLastRow[key] = sTotal;
			});

			oLastRow.NMEMB = "Total";

			aTableData.push(oLastRow);
			oModel.setProperty("/PESCAS_EMBARCACION",aTableData);
			this.bFlag = true;
		}
	});
});
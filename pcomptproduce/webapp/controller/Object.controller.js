sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"sap/ui/core/Fragment"
], function (BaseController, JSONModel, History, formatter,Fragment) {
	"use strict";

	return BaseController.extend("com.tasa.pcomptproduce.controller.Object", {

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

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().dataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			
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
			var sPreviousHash = History.getInstance().getPreviousHash(),
			oModel = this.getModel();

			this._destroyFragments();
			oModel.setProperty("/bMostrarPuertos",true);
			oModel.setProperty("/bMostrarPuertos",true);

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		 onPress : async function (oEvent) {
			 let oContext = oEvent.getSource().getBindingContext(),
			 oObject = oContext.getObject(),
			 sPath = oContext.getPath(),
			 sPathRow = sPath.split("/")[1],
			 sObjectId = sPath.split("/")[2],
			 oModel = oContext.getModel(),
			 oParam = this._getParametersService(oObject,sPathRow),
			 oService = {},
			 oData;

			oService.url = this.getHostService() +  "/api/sistemainformacionflota/PescaCompetenciaProduce";
			oService.serviceName = "Embarcaciones";
			oService.param = oParam;

			this.Count = 0; 
			this.CountService = 1;
			oData = await this.getDataService(oService);
			if(oData){
				oModel.setProperty("/embarcaciones", oData);
				oModel.setProperty("/pathRow", sPathRow);
				// The source is the list item that got pressed
				this.getRouter().navTo("embarcacion", {
					objectId: sObjectId
				});
			}
		},

		/**
		 * Event handler for select empresa
		 * @param {event} oEvent 
		 */
		 onSelectEmpresa: async function(oEvent){
			let sEmpresaKey = oEvent.getParameter("selectedKey"),
			oIconTabBar = this.getView().byId("iconTabBarId"),
			oView = this.getView(),
			oPage = oView.byId("pageEmpresa"),
			oModel = this.getModel(),
			oViewModel = this.getModel("objectView"),
			oArmadTable,
			oRecepTable,
			sTitle;

			oIconTabBar.removeAllContent();

			if(sEmpresaKey === "A") {

				oArmadTable = this.mTable["tableArmad"];
				oIconTabBar.addContent(oArmadTable);
				// oModel.setProperty("/help/CDEMP","");
				// oModel.setProperty("/help/DSEMP","");
				// oModel.setProperty("/help/RUCPRO","");
				// oArmadTable = this.mTables["TablaArma"];
				// if(!oArmadTable){
					// 	oArmadTable = await Fragment.load({
						// 		name:"com.tasa.pcomptproduce.view.fragments.TablaArma",
						// 		controller:this
						// 	});
						// 	this.mTables["TablaArma"] = oArmadTable;
						// 	oView.addDependent(oArmadTable);
						// }
						// oPage.setContent(oArmadTable);
			}else{
						
				oRecepTable = this.mTable["tableRecep"];
				oIconTabBar.addContent(oRecepTable);
						// oModel.setProperty("/help/sKeyCateg","");
						// oModel.setProperty("/help/CTGRA","");
				// oModel.setProperty("/help/CDGRE","");
				// oModel.setProperty("/help/DSGRE","");
				// oModel.setProperty("/help/CDEMB","");
				// oModel.setProperty("/help/CDEMP","");
				// oModel.setProperty("/help/KUNNR","");
				// oModel.setProperty("/help/NMEMB","");
				// oModel.setProperty("/help/MREMB","");
				// oModel.setProperty("/help/NAME1","");

				// oRecepTable = this.mTables["TablaRecep"];
				// oPage.setContent(oRecepTable);
			}

			// sTitle = this.getResourceBundle().getText("worklistTableTitle");
			// oViewModel.setProperty("/worklistTableTitle", sTitle);
			// oViewModel.setProperty("/bMostrarPuertos",false);
			// oModel.setProperty("/tableRows",{});
			// let bFlag = true;
			// this._destroyColumns(bFlag);
		},

		onOpenZonas: async function(oEvent){
			var oButton = oEvent.getSource(),
			oView = this.getView();
			// Popup.setWithinArea(oView.getId());
			// Create popover
			if (!this._pListPopover) {
				this._pListPopover = await this.loadFragment({
					name: "com.tasa.pcomptproduce.view.fragments.PuertosZona",
					controller: this
				});
				// oView.addDependent(this._pListPopover);
			}
			this._pListPopover.bindElement("/oDataApp");
			this._pListPopover.openBy(oButton);
		},

		onShowPuertos:function(){
			let sCod = "0000",
			oModel = this.getModel(),
			oTable = sap.ui.getCore().byId("tableRecep"),
			aColumns = oTable.getColumns(),
			iEmpresaIndex = oModel.getProperty("/empresaIndex");

			if(iEmpresaIndex === 0) oTable = sap.ui.getCore().byId("tableArmad");

			this._destroyColumns();
			this._buildPuertosColumns(sCod);
			this._pListPopover.close();
		},

		onHidePuertos:function(){
			let oModel = this.getModel(),
			aColumnZonas = oModel.getProperty("/oDataApp/str_zlt");
			this._buildZonasColumns(aColumnZonas,"CNPDS","CNDSH");
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
			var sObjectId =  oEvent.getParameter("arguments").objectId;
			this.pagePrev = oEvent.getParameter("targetControl").oFromPage.getId().split("---")[1];
			if(this.pagePrev !== "embarcaciones"){
				this.getModel().dataLoaded().then( function() {
					// var sObjectPath = this.getModel().createKey("Products", {
					// 	ProductID :  sObjectId
					// });
					this._bindView("/tableRows/" + sObjectId);
				}.bind(this));
			}
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this)
				}
			});
			oViewModel.setProperty("/busy", false);
		},

		_onBindingChange: async function(oEvent){
			let oContext = oEvent.getSource().getBoundContext(),
			oModel = oContext.getModel(),
			oViewModel = this.getModel("objectView"),
			oIconTabBar = this.getView().byId("iconTabBarId"),
			oObject = oContext.getObject(),
			sCDGRE = oObject.CDGRE,
			aKeys = Object.keys(oObject),
			aZonas = oModel.getProperty("/oDataApp/str_zlt"),
			iEmpresaIndex = oModel.getProperty("/empresaIndex"),
			iCountArmad = 0,
			iCountRecep = 0,
			aEmpresaArmad = [],
			aEmpresaRecep = [],
			oTableRecep,
			oTableRecepDet,
			oTableArmad,sPath1,sPath2;
			
			oViewModel.setProperty("/mainSelectedKey","R");
			oModel.setProperty("/bMostrarPuertos",false);
			oModel.setProperty("/bMostrarProp",false);
			this.mTables = this.mTables || {};
			aZonas = aZonas.filter(zona => {
				for (const key of aKeys) {
					if(zona.CDZLT === key ) return zona;
				}
			});

			if(iEmpresaIndex === 1){
				// Empresas Receptor
				aEmpresaRecep = this._getDataReceptorDet(oModel,sCDGRE);
				iCountRecep = aEmpresaRecep.length;
				oViewModel.setProperty("/visibleFilterArmad",false);
				oViewModel.setProperty("/tabCountRecep",iCountRecep);
				oModel.setProperty("/empresasReceptor",aEmpresaRecep);
				
				if(this.pagePrev !== "embarcaciones"){
					oTableRecepDet = await this.loadFragment({
						name:"com.tasa.pcomptproduce.view.fragments.TablaRecepDet"
					});
					oTableRecepDet.setFixedBottomRowCount(1);
					oIconTabBar.addContent(oTableRecepDet);
				}
			}
			if(iEmpresaIndex === 0){
				// Empresas Armador
				aEmpresaArmad = this._getDataArmador(oModel,sCDGRE);
				aEmpresaArmad = this._calcularFilasTotales(aEmpresaArmad);
				// Empresas Receptor
				aEmpresaRecep = this._getDataReceptor(oModel,sCDGRE);
				aEmpresaRecep = this._calcularFilasTotales(aEmpresaRecep);
				iCountArmad = aEmpresaArmad.length;
				iCountRecep = aEmpresaRecep.length;
				oViewModel.setProperty("/visibleFilterArmad",true);
				oViewModel.setProperty("/tabCountArmad",iCountArmad);
				oViewModel.setProperty("/tabCountRecep",iCountRecep);

				if(this.pagePrev !== "embarcaciones"){
					oTableRecep = await this.loadFragment({
						name:"com.tasa.pcomptproduce.view.fragments.TablaRecep"
					});
					oTableArmad = await this.loadFragment({
						name:"com.tasa.pcomptproduce.view.fragments.TablaArma"
					});
					oTableRecep.setFixedBottomRowCount(1)
					oTableArmad.setFixedBottomRowCount(1)
					oIconTabBar.addContent(oTableRecep);

					this.mTable = this.mTable || {};
					this.mTable["tableRecep"] = oTableRecep;
					this.mTable["tableArmad"] = oTableArmad;
				}
				sPath1 = "/empresasRecep"
				sPath2 = "/empresasArmad";
				oModel.setProperty("/empresasArmad",aEmpresaArmad);
				oModel.setProperty("/empresasRecep",aEmpresaRecep);
				this._bindRowsArmadTable(sPath2);
				this._bindRowsRecepTable(sPath1);
			}

			this.colZonasLength = 0;
			this.aColPuertosLength = 0;
					
			this._buildZonasColumns(aZonas,"CNPDS","CNDSH");
		},

		_getParametersService:function(oObject,sPathRow){
			let oModel = this.getModel(),

			iEmpresaIndex = oModel.getProperty("/empresaIndex"),
			oSearchingParam = oModel.getProperty("/SearchingParam"),
			sTCons = "P",
			sCDGRE = oObject.GRUPL,
			sGRUEB = oObject.CDGRE,
			sCTGRA = "";

			if(iEmpresaIndex === 0) {
				if(sPathRow === "empresasArmad") {
					sTCons = "A";
					sCDGRE = "";
					sGRUEB = "";
					sCTGRA = oSearchingParam.p_ctgra;
				}
			}

			let oParam = {
				p_cdgre: sCDGRE,
				p_cdpcn: oSearchingParam.p_cdpcn,
				p_ctgra: sCTGRA,
				p_emba: "E",
				p_empeb: oObject.CDEMP,
				p_fefin: oSearchingParam.p_fefin,
				p_feini: oSearchingParam.p_feini,
				p_grueb: sGRUEB,
				p_tcons: sTCons,
				p_option: [],
				p_options: [],
				// "p_zcdzar": "string"
			};

			return oParam;
		},

		_getDataReceptorDet:function(oModel,sCDGRE){
			let aEmp = oModel.getProperty("/oDataApp/str_emp"),
			aEpp = oModel.getProperty("/oDataApp/str_epp"),
			aEmpresas = [];
			aEmp.forEach(emp => {
				if(sCDGRE === emp.CDGRE){
					emp.indProp = [];
					if(emp.EMBPR > 0) {
						emp.indProp.push({ DSEMP:"Propios", NREMB:emp.EMBPR });
					}
					if(emp.EMBTR > 0){
						emp.indProp.push({ DSEMP:"Terceros", NREMB:emp.EMBTR });
					}
					aEmpresas.push(emp);
				}
			});
			aEmpresas.forEach(empr => {
				let totCNDSH = 0,
				propCNDPR = 0,
				propCNDSH = 0,
				tercCNDPR = 0,
				tercCNDSH = 0;
				aEpp.forEach(epp=>{
					if(epp.EMPTA === empr.CDEMP){
						empr[epp.CDZLT] = epp;
						empr.indProp.forEach(ind => {
							if(ind.DSEMP === "Propios"){
								ind[epp.CDZLT] = {};
								ind[epp.CDZLT].CNPDS = epp.CNDPR;
								ind[epp.CDZLT].CNDSH = epp.DSHPR;
							}
							if(ind.DSEMP === "Terceros"){
								if(empr.EMBTR > 0){
									ind[epp.CDZLT] = {};
									ind[epp.CDZLT].CNPDS = epp.CPDTR;
									ind[epp.CDZLT].CNDSH = epp.DSHTR;
								}
							}
						});

						totCNDSH += epp.CNDSH;
						propCNDPR += epp.CNDPR;
						propCNDSH += epp.DSHPR;
						tercCNDPR += epp.CPDTR;
						tercCNDSH += epp.DSHTR;
					}
				});
				empr.CNDSH = totCNDSH;
				if(empr.indProp[0]){
					empr.indProp[0].CNPDS = propCNDPR;
					empr.indProp[0].CNDSH = propCNDSH;
				}
				if(empr.indProp[1]){
					empr.indProp[1].CNPDS = tercCNDPR;
					empr.indProp[1].CNDSH = tercCNDSH;
				}
				
			});
			return aEmpresas;
		},

		_getDataArmador:function(oModel,sCDGRE){
			let aEmp = oModel.getProperty("/oDataApp/str_emp"),
			aEpp = oModel.getProperty("/oDataApp/str_epp"),
			aEmpresas = [];
			aEmp.forEach(emp => {
				if(sCDGRE === emp.CDGRE){
					aEmpresas.push({
						DSGRE: emp.DSEMP,
						NREMB: emp.NREMB,
						CDEMP: emp.CDEMP,
						CAVNC: emp.CAVNC,
						CAVSU: emp.CAVSU,
						CPRNC: emp.CPRNC,
						CPRSU: emp.CPRSU
					});
				}
			});
			aEmpresas.forEach(empr => {
				let totCNDSH = 0,
				totCNPDS = 0;
				aEpp.forEach(epp=>{
					if(sCDGRE === epp.CDGRE){
						if(empr.CDEMP === epp.EMPEB){
							empr[epp.CDZLT] = {};
							empr[epp.CDZLT].CNPDS = epp.CNPDS
							empr[epp.CDZLT].CNDSH = epp.CNDSH
							totCNDSH += epp.CNDSH;
							totCNPDS += epp.CNPDS;
						}
					}
				});
				empr.nDesTotalD = totCNDSH;
				empr.pescaTotalD = totCNPDS;
				if(totCNDSH > 0) empr.nCocPescaNdesD = totCNPDS/totCNDSH
				
			});
			return aEmpresas;
		},

		_getDataReceptor:function(oModel,sCDGRE){
			let aPlm = oModel.getProperty("/oDataApp/str_plm"),
			aGrp = oModel.getProperty("/oDataApp/str_grp"),
			aEmpresas = [];
			aPlm.forEach(plm => {
				if(sCDGRE === plm.CDGRE){
					plm.DSGRE = plm.DSEMP
					aEmpresas.push(plm)
				}
			});
			aEmpresas.forEach(empr => {
				let totCNDSH = 0;
				aGrp.forEach(grp=>{
					if(grp.EMPTA === empr.CDEMP && grp.CDGRE === empr.CDGRE){
						empr[grp.CDZLT] = grp;
						totCNDSH += grp.CNDSH;
					}
				});
				empr.CNDSH = totCNDSH;
				if(totCNDSH>0) empr.nCocPescaNdesD = empr.CNPDS / totCNDSH;
			});
			return aEmpresas;
		},

		_buildZonasColumns:function(aColumnZonas,sPath1,sPath2){
			this._destroyColumns();
			let oModel = this.getModel(),
			iEmpresaIndex = oModel.getProperty("/empresaIndex"),
			aColumnHeader,
			oTable1,
			oTable2;

			if(iEmpresaIndex === 0) {
				oTable1 = this.getView().byId("tableRecep");
				oTable2 = this.getView().byId("tableArmad");
			}else{
				oTable1 = this.getView().byId("tableRecepDet")
			}

			this.colZonasLength = aColumnZonas.length * 3;
			this.aColPuertosLength = 0;
			
			aColumnZonas.forEach(oCol => {
				aColumnHeader = this.getTableColumn(oCol.DSZLT,oCol.CDZLT,sPath1,sPath2);
				aColumnHeader.forEach(oColHeader => {
					if(oTable1) oTable1.addColumn(oColHeader);
				});
			});
			aColumnZonas.forEach(oCol => {
				aColumnHeader = this.getTableColumn(oCol.DSZLT,oCol.CDZLT,sPath1,sPath2);
				aColumnHeader.forEach(oColHeader => {
					if(oTable2) oTable2.addColumn(oColHeader);
				});
			});
		},

		_buildPuertosColumns:function(sCodZona){
			this._destroyColumnsPuertos();
			let oTable = this.getView().byId("tableRecepDet"),
			oModel = this.getModel(),
			iEmpresaIndex = oModel.getProperty("/empresaIndex"),
			aPuertos = oModel.getProperty("/oDataApp/str_pto"),
			aPuertosZona,
			sPath1 = "CNPDS",
			sPath2 = "CNDSH",
			aColumnHeader;

			// if(iEmpresaIndex === 0) oTable = sap.ui.getCore().byId("tableArmad");
			
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
		 * Internal helper method for binding Armador table
		 * @param {string} sPath 
		 */
		 _bindRowsArmadTable:function(sPath){
			let oTableArmad = this.getView().byId("tableArmad"),
			that = this;

			oTableArmad.bindRows({
				path:sPath,
				events:{
					change: function(oEvent){
						let iLastStartIndex = oEvent.getSource().iLastStartIndex;
						if(iLastStartIndex !== undefined){
							// that.onRowsDataChange(oEvent);
						}
					}
				}
			});
			
		},

		/**
		 * Internal helper method for binding Receptor table
		 * @param {string} sPath 
		 */
		_bindRowsRecepTable:function(sPath){
			let oTableRecep = this.getView().byId("tableRecep"),
			that = this;
			oTableRecep.bindRows({
				path:sPath,
				events:{
					change: function(oEvent){
						let iLastStartIndex = oEvent.getSource().iLastStartIndex;
						if(iLastStartIndex !== undefined){
							// that.onRowsDataChange(oEvent);
						}
					}
				}
			})
		},
		
		/**
		 * Internal helper method to destroy dynamic columns
		 */
		 _destroyColumns:function(){
			let oModel = this.getModel(),
			iEmpresaIndex = oModel.getProperty("/empresaIndex"),
			oTable1,
			oTable2,
			aColumns1,
			aColumns2,
			iLimitInf1,
			iLimitInf2;

			if(iEmpresaIndex === 0) {
				oTable1 = this.getView().byId("tableRecep");
				oTable2 = this.getView().byId("tableArmad");
				aColumns1 = oTable1.getColumns();
				aColumns2 = oTable2.getColumns();
				iLimitInf1 = aColumns1.length - this.colZonasLength - this.aColPuertosLength;
				iLimitInf2 =  aColumns2.length - this.colZonasLength;
				for (let i = aColumns2.length-1; i > iLimitInf2 - 1; i--) {
					oTable2.removeColumn(aColumns2[i]);
				}
			}else{
				oTable1 = this.getView().byId("tableRecepDet");
				aColumns1 = oTable1.getColumns();
				iLimitInf1 = aColumns1.length - this.colZonasLength - this.aColPuertosLength;
			};
			for (let i = aColumns1.length-1; i > iLimitInf1 - 1; i--) {
				oTable1.removeColumn(aColumns1[i]);
			}

			// aRows = oTable.getRows();

			// aRows.forEach(oRow => {
			// 	oRow.getCells()[0].setActive(true);
			// 	oRow.getCells()[0].setState("Information");
			// });
			this.colZonasLength = 0;
			this.aColPuertosLength = 0;
		},

		/**
		 * Internal helper method to destroy dynamic puertos
		 */
		_destroyColumnsPuertos:function(){
			let oModel = this.getModel(),
			oViewModel = this.getModel("worklistView"),
			oTable = this.getView().byId("tableRecep"),
			iEmpresaIndex = oModel.getProperty("/empresaIndex");

			let aColumns = oTable.getColumns(),
			iLimitInf = aColumns.length - this.aColPuertosLength;
			if(this.aColPuertosLength === 0) return;
			for (let i = aColumns.length-1; i > iLimitInf-1; i--) {
				oTable.removeColumn(aColumns[i]);
			};
			// oViewModel.setProperty("/bMostrarPuertos",false);
			this.aColPuertosLength = 0;
		},

		_destroyFragments:function(){
			let oTableRecepDet = this.getView().byId("tableRecepDet"),
			oTableRecep = this.getView().byId("tableRecep"),
			oTableArmad = this.getView().byId("tableArmad");

			if(oTableRecepDet) oTableRecepDet.destroy();
			if(oTableRecep) oTableRecep.destroy();
			if(oTableArmad) oTableArmad.destroy();
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
				iTotCNPDS,
				iTotNDes;

				aKeys.forEach(key => {
					sTotal = 0;
					switch (key) {
						case "DSGRE":
							sTotal = "";
							break;
						case "pescaTotalD":
						case "NREMB":
						case "NREMB":
						case "nCocPescaNdesD":
						default:
							sTotal = aTableRows.reduce( (acc , obj) => {
								return acc + obj[key]
							},0);
							break;
					}
					oTotals[key] = sTotal;
				});

				aStrZlt.forEach(zona => {
					iTotCNPDS = 0;
					iTotNDes = 0;

					aTableRows.forEach(row => {
						if(row[zona.CDZLT]) iTotCNPDS += row[zona.CDZLT].CNPDS;
						if(row[zona.CDZLT]) iTotNDes += row[zona.CDZLT].CNDSH;
					});
					oTotals[zona.CDZLT] = {}
					oTotals[zona.CDZLT].CNPDS = iTotCNPDS;
					oTotals[zona.CDZLT].CNDSH = iTotNDes;
				});
				aTableRows.push(oTotals);
			}

			return aTableRows;
		}


	});

});
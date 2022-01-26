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
				this.getRouter().navTo("worklist", {}, true);
			}
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
			this.getModel().dataLoaded().then( function() {
				// var sObjectPath = this.getModel().createKey("Products", {
				// 	ProductID :  sObjectId
				// });
				this._bindView("/tableRows/" + sObjectId);
			}.bind(this));
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
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.dataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
			oViewModel.setProperty("/busy", false);
		},

		_onBindingChange: async function(oEvent){
			let oContext = oEvent.getSource().getBoundContext(),
			oModel = oContext.getModel(),
			oObject = oContext.getObject(),
			sCDGRE = oObject.CDGRE,
			aColumnZonas = oModel.getProperty("/oDataApp/str_zlt"),
			iEmpresaIndex = oModel.getProperty("/empresaIndex"),
			aEmpresa,
			oEmpresaTable;

			if(iEmpresaIndex === 0){
				aEmpresa = this._getDataArmador(oModel,sCDGRE)
			}else{
				aEmpresa = this._getDataReceptor(oModel,sCDGRE);
				oEmpresaTable = await Fragment.load({name:"com.tasa.pcomptproduce.view.fragments.TablaEmpresas"})
			} 
			

			this._buildZonasColumns(aColumnZonas,"CNPDS","CNDSH");
			oModel.setProperty("/empresas",aEmpresa);
		},
		
		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		 onPress : function (oEvent) {
			// The source is the list item that got pressed
			this.getRouter().navTo("embarcacion", {
				objectId: oEvent.getSource().getBindingContext().getPath().split("/")[2]
			});
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_getDataReceptor:function(oModel,sCDGRE){
			let aEmp = oModel.getProperty("/oDataApp/str_emp"),
			aEpp = oModel.getProperty("/oDataApp/str_epp"),
			aEmpresas = [];
			aEmp.forEach(emp => {
				if(sCDGRE === emp.CDGRE){
					aEmpresas.push({
						DSEMP:emp.DSEMP,
						CDGRE:emp.CDGRE,
						CNPDS:emp.CNPDS,
						CNDSH:emp.CNDSH,
						NREMB:emp.NREMB,
						CDEMP:emp.CDEMP,
						indProp:[
							{DSEMP:"Propios", NREMB:emp.EMBPR},
							{DSEMP:"Terceros", NREMB:emp.EMBTR}
						]
					});
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
						//propios
						// empr.indProp[0][epp.CDZLT] = epp;
						empr.indProp[0][epp.CDZLT] = {};
						empr.indProp[0][epp.CDZLT].CNPDS = epp.CNDPR;
						empr.indProp[0][epp.CDZLT].CNDSH = epp.DSHPR;
						
						// terceros
						empr.indProp[1][epp.CDZLT] = {};
						empr.indProp[1][epp.CDZLT].CNPDS = epp.CPDTR;
						empr.indProp[1][epp.CDZLT].CNDSH = epp.DSHTR;
						
						totCNDSH += epp.CNDSH;
						propCNDPR += epp.CNDPR;
						propCNDSH += epp.DSHPR;
						tercCNDPR += epp.CPDTR;
						tercCNDSH += epp.DSHTR;
					}
				});
				empr.CNDSH = totCNDSH;
				empr.indProp[0].CNPDS = propCNDPR;
				empr.indProp[0].CNDSH = propCNDSH;
				empr.indProp[1].CNPDS = tercCNDPR;
				empr.indProp[1].CNDSH = tercCNDSH;
				
			});
			return aEmpresas;
		},

		_buildZonasColumns:function(aColumnZonas,sPath1,sPath2){
			this._destroyColumns();
			let oTable = this.getView().byId("empresasTable"),
			aColumnHeader;
			this.colZonasLength = aColumnZonas.length * 3;
			this.aColPuertosLength = 0;
			
			aColumnZonas.forEach(oCol => {
				aColumnHeader = this.getTableColumn(oCol.DSZLT,oCol.CDZLT,sPath1,sPath2);
				aColumnHeader.forEach(oColHeader => {
					oTable.addColumn(oColHeader);
				});
			});
		},
		
		/**
		 * Internal helper method to destroy dynamic columns
		 */
		 _destroyColumns:function(){
			let oTable = this.getView().byId("empresasTable"),
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


	});

});
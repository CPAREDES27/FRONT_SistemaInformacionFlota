sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"../model/formatter",
	"sap/ui/core/BusyIndicator",
], function (BaseController, JSONModel, History, Filter, formatter, BusyIndicator) {
	"use strict";

	return BaseController.extend("com.tasa.pdeclarada.controller.Object", {

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
				this._bindView("/str_tp/" + sObjectId);
			}.bind(this));
		},

		onUpdateFinished:function(oEvent){
			let sTitle,
			iTotalItems = oEvent.getParameter("total"),
			oViewModel = this.getModel("objectView"),
			oTable = this.getView().byId("detailTableId"),
			oBindingTable = oTable.getBinding("items"),
			sPath = oBindingTable.getPath(),
			oModel = oBindingTable.getModel(),
			aIndices = oBindingTable.aIndices,
			sTipEmb = oViewModel.getProperty("/selectedKey"),
			oItem;

			if(aIndices.length>0){
				let sTotCBOD = 0, sTotPescDecl =0, sTotPescDes=0,sTotCalas=0;
				aIndices.forEach(indice=>{
					oItem = oModel.getProperty(sPath+"/"+indice);
					sTotCBOD += oItem["CPPMS"];
					sTotPescDecl += oItem["CNPCM"];
					sTotPescDes += oItem["CNPDS"];
					sTotCalas += oItem["CNTCL"];
				})
				oModel.setProperty("/totalCBOD", sTotCBOD.toFixed(3));
				oModel.setProperty("/totalPescDecl", sTotPescDecl.toFixed(0));
				oModel.setProperty("/totalPescDesc", sTotPescDes.toFixed(3));
				oModel.setProperty("/totalCalas", sTotCalas.toFixed(0));
			}else{
				oModel.setProperty("/totalCBOD", 0);
				oModel.setProperty("/totalPescDecl", 0);
				oModel.setProperty("/totalPescDesc", 0);
				oModel.setProperty("/totalCalas", 0);
			}
			// only update the counter if the length is final
			if (oBindingTable.isLengthFinal()) {
				if (sTipEmb==="P") {
					sTitle = this.getResourceBundle().getText("embPropias", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("embTerceras",[iTotalItems]);
				}
				oViewModel.setProperty("/detailViewTitle", sTitle);
			}
		},

		onFilterSelect:function(oEvent){
			let sKey = oEvent.getParameter("key"),
			oObject = oEvent.getSource().getBindingContext().getObject();

			this._applyFilters(oObject,sKey);
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
			oView = this.getView(),
			oModel = this.getModel(),
			oObject = oModel.getProperty(sObjectPath);
			this._applyFilters(oObject,"P");

			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/selectedKey", "P");
			oView.bindElement({
				path: sObjectPath,
				events: {
					// change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oModel.dataLoaded().then(function () {
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
		},

		_applyFilters:function(oObject,sKey){
			let oView = this.getView(),
			sCodPlanta = oObject["CDPTA"],
			oTable = oView.byId("detailTableId"),
			oBindingTable = oTable.getBinding("items"),
			aFilters = new Array,
			oFilter = new Object;

			oFilter = new Filter([new Filter("CDPTA","EQ",sCodPlanta),new Filter("INPRP","EQ",sKey)],true);
			aFilters.push(oFilter);
			oBindingTable.filter(aFilters);
		},

		onNavMarea: async function (evt) {
			return;
			BusyIndicator.show(0);
			//console.log(evt.getSource().getParent().getBindingContext("undefined").getObject());
			var obj = evt.getSource().getParent().getBindingContext("undefined").getObject();
			if (obj) {
				var cargarMarea = await this.cargarDatosMarea(obj);
				if (cargarMarea) {
					var modelo = this.getOwnerComponent().getModel("DetalleMarea");
					var modeloConsultaMarea = this.getModel("undefined");
					var dataModelo = modelo.getData();
					var dataConsultaMarea = modeloConsultaMarea.getData();
					var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
					oStore.put("DataModelo", dataModelo);
					oStore.put("PescaDeclarada", dataConsultaMarea);
					oStore.put("AppOrigin", "pdeclarada");
					BusyIndicator.hide();
					var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNav.toExternal({
						target: {
							semanticObject: "mareaevento",
							action: "display"
						}
					});
				} else {
					BusyIndicator.hide();
				}
			}

		}

		
	});

});
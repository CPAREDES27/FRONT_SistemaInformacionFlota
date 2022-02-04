sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/formatter",
	"../model/models",
	"sap/base/Log",
	"sap/ui/core/BusyIndicator",
	"../Service/TasaBackendService",
    "./Utils",
    'sap/m/MessageToast',
], function (Controller,
	UIComponent,
	library,
	formatter,
	models,
	Log,
	BusyIndicator,
	TasaBackendService,
	Utils,
    MessageToast
	) {
	"use strict";

	// shortcut for sap.m.URLHelper
	// var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("com.tasa.pdeclarada.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

        Count:0,
        CountService:0,

        /**
		 * 
		 * @returns url service 
		 */
		 getHostService: function () {
            var urlIntance = window.location.origin,
            servicioNode ; 

			if (urlIntance.indexOf('tasaqas') !== -1) {
                servicioNode = 'qas'; // aputando a QAS
            } else if (urlIntance.indexOf('tasaprd') !== -1) {
                servicioNode = 'prd'; // apuntando a PRD
            }else if(urlIntance.indexOf('localhost') !== -1){
				servicioNode = 'cheerful-bat-js'; // apuntando a DEV
			}else{
				servicioNode = 'cheerful-bat-js'; // apuntando a DEV
			}

            return `https://cf-nodejs-${servicioNode}.cfapps.us10.hana.ondemand.com`;
        },

        /**
         * Establece un mensaje de aviso para un evento determinado
         * @param {string} sType 
         * @param {string} sMessage 
         */
		 setAlertMessage:function(sType,sMessage){
            let sTitle = "Mensaje";
            if(sType === "success"){
                MessageBox.success(sMessage,{
                    title: sTitle
                });
            };
            if(sType === "information"){
                MessageBox.information(sMessage,{
                    title: sTitle
                });
            };
            if(sType === "warning"){
                MessageBox.warning(sMessage,{
                    title: sTitle
                });
            };
            if(sType === "error") {
                MessageBox.warning(sMessage,{
                    title: sTitle
                });
            };
        },

		getDataService: async function(oService){
            try {
				BusyIndicator.show(0);
				this.Count++;
				let oFetch = await fetch(oService.url,{
					method:'POST',
					body:JSON.stringify(oService.param)
				});
				if(oFetch.status===200){
					if(this.Count === this.CountService) BusyIndicator.hide();
					return await oFetch.json();
				}else{
					BusyIndicator.hide();
					Log.error(`Status:${oFetch.status}, ${oFetch.statusText}`);
					return null;
				}
			} catch (error) {
				Log.error(`Error:${error}`);
				BusyIndicator.hide();
				this.setAlertMessage("error","Hubo un error de conexión con el servicio "/* + oService.serviceName*/);
			}
		},

        getParametersService:function(oObject){
            return {
                fieldstr_te : [],
                fieldstr_tp : [],
                p_cdmma : oObject.cdmma,
                p_fecon : oObject.fecon,
                p_user : ""
            }
        },

        setDataStructure:function(oData){
			let aDataTp = oData["str_tp"],
            oModel = this.getModel(),
			aDataTe;
			if(aDataTp.length>0){
				let aPropia,
				aTerceras;
				aDataTe = oData["str_te"];
				aDataTp.forEach(oItem=>{
					oItem.PORC_CBOD_OPER=oItem.PORC_CBOD_OPER.toFixed();
					oItem.PORC_CBOD=oItem.PORC_CBOD.toFixed();
					aPropia = aDataTe.filter(item=>item.CDPTA===oItem.CDPTA&&item.INPRP==="P");
					aTerceras = aDataTe.filter(item=>item.CDPTA===oItem.CDPTA&&item.INPRP==="T");
					oItem.propias = aPropia;
					oItem.terceras = aTerceras;
					oItem.cantPropias = aPropia.length;
					oItem.cantTerceras = aTerceras.length;                      
					
				});
				var propias=aDataTe.filter(item=>item.INPRP==="P").length;
				var terceros=aDataTe.filter(item=>item.INPRP==="T").length;
				// var ninguno=aDataTe.filter(item=>item.INPRP==="").length;

				this.getGraphData(aDataTp);
				this.calcularTotales(aDataTp,propias, terceros);
				this.getBarsPropiedad(aDataTp);
				oModel.setProperty(`/str_tp`,aDataTp);
				oModel.setProperty(`/str_te`,aDataTe);
				oModel.setProperty("/rowCount",aDataTp.length);
				this.setTotalRowTable();
			}else{
				this.getMessageDialog("Information", "No se econtraron registros para la busqueda");
				oModel.setProperty(`/str_tp`,[]);
			}
		},

		getDataMainTable: async function(oModel,oParam){
			const sUrl = HOST + '/api/sistemainformacionflota/PescaDeclarada',
			param = new Object;
            
			param.fieldstr_te= [];
			param.fieldstr_tp= [];
			param.p_cdmma= oParam.cdmma;
			param.p_fecon= oParam.fecon;
			param.p_user="";
			let oMotMareaData = await this.getDataService(sUrl, param),
			aDataTp,
			aDataTe;
			if(oMotMareaData){
				
				if(this.count===this.servicesLenght) BusyIndicator.hide();
			}
		},

		calcularTotales: function (listPescaDeclarada, propios, terceros) {
			/**
			 * Copia del primer elemento para obtener su modelo
			 */
			let pescaDeclaradaTotal = { ...listPescaDeclarada[0] };

			/**
			 * Cálculos de totales de algunos campos
			 */
			let total_CEMBA = 0;
			let total_CEMBP = 0;
			let total_CEMBI = 0;
			let total_CEMBO = 0;
			let total_CNPDS = 0;
			let total_TOT_PESC_DECL = 0;
			let total_TOT_NUM_EMBA = 0;
			let total_CNPEP = 0;
			let total_NEMBP = 0;
			let total_CNPET = 0;
			let total_NEMBT = 0;
			let total_PROM_PESC_PROP = 0;
			let total_PROM_PESC_TERC = 0;
			let total_TOTED = 0;
            let total_Propios= 0;
            let total_Terceros= 0;

			listPescaDeclarada.forEach(p => {
				total_CEMBA += p.CEMBA;
				total_CEMBP += p.CEMBP;
				total_CEMBI += p.CEMBI;
				total_CEMBO += p.CEMBO;
				total_CNPDS += p.CNPDS;
				total_TOT_PESC_DECL += p.TOT_PESC_DECL;
				total_TOT_NUM_EMBA += p.TOT_NUM_EMBA;
				total_CNPEP += p.CNPEP;
				total_NEMBP += p.NEMBP;
				total_CNPET += p.CNPET;
				total_NEMBT += p.NEMBT;
				total_PROM_PESC_PROP += p.PROM_PESC_PROP;
				total_PROM_PESC_TERC += p.PROM_PESC_TERC;
				total_TOTED += p.TOTED;
			});

			/**
			 * Limpieza y asignación de totales
			 */
			Object.keys(pescaDeclaradaTotal).forEach(k => {
				pescaDeclaradaTotal[k] = null;
			});
			pescaDeclaradaTotal.DESCR = "Total general";
			pescaDeclaradaTotal.CEMBA = total_CEMBA;
			pescaDeclaradaTotal.CEMBP = total_CEMBP;
			pescaDeclaradaTotal.CEMBI = total_CEMBI;
			pescaDeclaradaTotal.CEMBO = total_CEMBO;
			pescaDeclaradaTotal.CNPDS = total_CNPDS.toFixed(3);
			pescaDeclaradaTotal.TOT_PESC_DECL = total_TOT_PESC_DECL;
			pescaDeclaradaTotal.TOT_NUM_EMBA = total_TOT_NUM_EMBA;
			pescaDeclaradaTotal.CNPEP = total_CNPEP;
			pescaDeclaradaTotal.NEMBP = total_NEMBP;
			pescaDeclaradaTotal.CNPET = total_CNPET;
			pescaDeclaradaTotal.NEMBT = total_NEMBT;
			pescaDeclaradaTotal.PROM_PESC_PROP = total_PROM_PESC_PROP.toFixed(0);
			pescaDeclaradaTotal.PROM_PESC_TERC = total_PROM_PESC_TERC.toFixed(0);
			pescaDeclaradaTotal.TOTED = total_TOTED;
            pescaDeclaradaTotal.cantPropias=parseInt(propios);
            pescaDeclaradaTotal.cantTerceras=parseInt(terceros);
            // pescaDeclaradaTotal.cantVacio=parseInt(ninguno);

			listPescaDeclarada.push(pescaDeclaradaTotal);

			//Totales genéricos
			this.getModel().setProperty("/totalGenPescDecl", pescaDeclaradaTotal.TOT_PESC_DECL);
			this.getModel().setProperty("/totalGenNumEmba", pescaDeclaradaTotal.TOT_NUM_EMBA);
			this.getModel().setProperty("/totalGenPescDesc", pescaDeclaradaTotal.CNPDS);
			this.getModel().setProperty("/totalGenNumEmbaDesc", pescaDeclaradaTotal.TOTED);
		},

		getGraphData:function(aData){
			const aGraphData = aData.map(s => {
				return {
					descripcion: s.DESCR,
                    valuePorPesDe: s.PORC_PESC_DECL,
                    valuePorCBOD: s.PORC_CBOD
				};
			});

			this.getModel().setProperty("/STR_TP_GRAPHICS", aGraphData);
			this.getModel().setProperty("/countBars", aData.length-1);
           
		},
        getBarsPropiedad:function(aData){
            var total=aData[aData.length-1];
            total.cantVacio = 0;
            var totalEmbarca=total.cantPropias+total.cantTerceras/*+total.cantVacio*/;

            var items=[
                {
                    descripcion:"",
                    valueProp: parseInt(((total.cantPropias*100)/totalEmbarca).toFixed(0)),
                    valueTerc: parseInt(((total.cantTerceras*100)/totalEmbarca).toFixed(0)),
                    // valueNone: parseInt(((total.cantVacio*100)/totalEmbarca).toFixed(0))
                    // value:parseInt(((total.cantPropias*100)/totalEmbarca).toFixed(0)),
                    // porcentaje:((total.cantPropias*100)/totalEmbarca).toFixed(0).concat("%"),
                    // cantidad:total.cantPropias
                    

                },
                // {
                //     descripcion:"Terceros",
                //     value:parseInt(((total.cantTerceras*100)/totalEmbarca).toFixed(0)),
                //     porcentaje:((total.cantTerceras*100)/totalEmbarca).toFixed(0).concat("%"),
                //     cantidad:total.cantTerceras

                // },
                // {
                //     descripcion:"Ninguno",
                //     value:parseInt(((total.cantVacio*100)/totalEmbarca).toFixed(0)),
                //     porcentaje:((total.cantVacio*100)/totalEmbarca).toFixed(0).concat("%"),
                //     cantidad:total.cantVacio
                // }
             ];		
			this.getModel().setProperty("/Propiedad", items);
        },

		setTotalRowTable:function(){
			let oTable = sap.ui.getCore().byId("application-pescaDeclarada-display-component---worklist--tablePescaDeclarada");
			if(!oTable){
				return;
			}
			let aRows = oTable.getRows(),
			iLastIndexRows = aRows.length-1,
			oRowLast = aRows[iLastIndexRows],
			iCellsLength = oRowLast.getCells()["length"],
			oNavButton = oRowLast.getCells()[iCellsLength-1],
			oObjectStatus = oRowLast.getCells()[0];
			oNavButton.setVisible(false);
			oObjectStatus.setState("Warning");
		},

		getMessageDialog:function(sTypeDialog,sMessage){
			let oMessageDialog;
			if (!oMessageDialog) {
				oMessageDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: "Mensaje",
					state: sTypeDialog,
					content: new sap.m.Text({ text: sMessage }),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "OK",
						press: function () {
							// BusyIndicator.show(0);
							oMessageDialog.close();
						}.bind(this)
					})
				});
			}

			oMessageDialog.open();
		},

		getCurrentUser: async function () {
            const oUserInfo = await this.getUserInfoService();
            const sUserEmail = oUserInfo.getEmail(); //fgarcia@tasa.com.pe
            var emailSplit = sUserEmail.split("@");
            var usuario = emailSplit[0].toUpperCase();
            if (emailSplit[1] == "xternal.biz") {
                usuario = "FGARCIA";
            }
            return usuario;
        },

        getUserInfoService: function () {
            return new Promise(resolve => sap.ui.require([
                "sap/ushell/library"
            ], oSapUshellLib => {
                const oContainer = oSapUshellLib.Container;
                const pService = oContainer.getServiceAsync("UserInfo"); // .getService is deprecated!
                resolve(pService);
            }));
        },

		cargarDatosMarea: async function(obj){
			var marea = obj.NRMAR;
            var bOk = false;
            var usuario = await this.getCurrentUser();
            var response = await TasaBackendService.obtenerDetalleMarea(marea, usuario);
            if (response) {
                bOk = await this.setDetalleMarea(response);
            }
            return bOk;
		},

		setDetalleMarea: async function (data) {
            BusyIndicator.show(0);
            var me = this;
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var marea = data.s_marea[0];
            var eventos = data.s_evento;
            var incidental = data.str_pscinc;
            var biometria = data.str_flbsp;
            var motivoResCombu = ["1", "2", "4", "5", "6", "7", "8"];
            await this.clearAllData();//inicalizar valores
            modeloDetalleMarea.setProperty("/Cabecera/INDICADOR", "E");
            //setear cabecera de formulario
            //var cabecera = dataDetalleMarea.Cabecera;
            var cabecera = modeloDetalleMarea.getProperty("/Cabecera");
            for (var keyC in cabecera) {
                if (marea.hasOwnProperty(keyC)) {
                    cabecera[keyC] = marea[keyC];
                }
            }

            //setear pestania datos generales
            //var datsoGenerales = dataDetalleMarea.DatosGenerales;
            var datsoGenerales = modeloDetalleMarea.getProperty("/DatosGenerales");
            for (var keyC in datsoGenerales) {
                if (marea.hasOwnProperty(keyC)) {
                    datsoGenerales[keyC] = marea[keyC];
                }
            }

            //cargar dsitribucion de flota
            var codigo = modeloDetalleMarea.getProperty("/Cabecera/CDEMB");
            await this.obtenerDatosDistribFlota(codigo);

            var estMarea = modeloDetalleMarea.getProperty("/DatosGenerales/ESMAR");
            var marea = modeloDetalleMarea.getProperty("/Cabecera/NRMAR");
            if (estMarea == "A") {
                await this.obtenerDatosMareaAnt(marea, codigo);
            }

            //setear lista de eventos
            modeloDetalleMarea.setProperty("/Eventos/TituloEventos", "Eventos (" + eventos.length + ")")
            //dataDetalleMarea.Eventos.TituloEventos = "Eventos (" + eventos.length + ")";

            for (let index1 = 0; index1 < eventos.length; index1++) {
                const element = eventos[index1];
                element.Indicador = "E";
                element.LatitudD = Utils.getDegrees(element.LTGEO);
                element.LatitudM = Utils.getMinutes(element.LTGEO);
                element.LongitudD = Utils.getDegrees(element.LNGEO);
                element.LongitudM = Utils.getMinutes(element.LNGEO)
            }

            //dataDetalleMarea.Eventos.Lista = eventos;
            modeloDetalleMarea.setProperty("/Eventos/Lista", eventos);
            //dataDetalleMarea.Incidental = incidental;
            modeloDetalleMarea.setProperty("/Incidental", incidental);
            //dataDetalleMarea.Biometria = biometria;
            modeloDetalleMarea.setProperty("/Biometria", biometria);

            modeloDetalleMarea.setProperty("/Config/visibleTabReserva", false);
            modeloDetalleMarea.setProperty("/Config/visibleTabVenta", false);
            var inprp = modeloDetalleMarea.getProperty("/Cabecera/INPRP");
            var motivo = modeloDetalleMarea.getProperty("/Cabecera/CDMMA");
            if (inprp == "P" && motivoResCombu.includes(motivo)) {
                await this.obtenerReservasCombustible(marea, codigo);
            }

            if (inprp == "T") {
                await this.obtenerVentasCombustible(marea);
            }

            //la pestania de reserva de combustible y venta de combustible se setean en el Detalle

            //setear config inicial
            /*dataDetalleMarea.Config.visibleLinkSelecArmador = false;
            dataDetalleMarea.Config.visibleArmadorRuc = false;
            dataDetalleMarea.Config.visibleArmadorRazon = false;
            dataDetalleMarea.Config.visibleArmadorCalle = false;
            dataDetalleMarea.Config.visibleArmadorDistrito = false;
            dataDetalleMarea.Config.visibleArmadorProvincia = false;
            dataDetalleMarea.Config.visibleArmadorDepartamento = false;*/

            //refrescar modelo y navegar al detalle
            modeloDetalleMarea.refresh();
            BusyIndicator.hide();
            oRouter.navTo("DetalleMarea");
            //me.navToExternalComp();
            return true;
        },

        clearAllData: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            modelo.setProperty("/DatosGenerales/ESMAR", "A");
            modelo.setProperty("/Cabecera/FCCRE", Utils.strDateToSapDate(Utils.dateToStrDate(new Date())));
            modelo.setProperty("/Cabecera/HRCRE", Utils.strHourToSapHo(Utils.dateToStrHours(new Date())));
            modelo.setProperty("/Cabecera/ATCRE", await this.getCurrentUser());
        },

        obtenerDatosDistribFlota: async function (codigo) {
            //var me = this;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            //var dataSesionModel = this.getModel("DataSession");
            //var usuario = dataSesionModel.getProperty("/User");
            var usuario = await this.getCurrentUser();
            //var distribFlota = this.getModel("DistribFlota");
            var distribFlota = modelo.getProperty("/DistribFlota");
            var constantsUtility = sap.ui.getCore().getModel("ConstantsUtility");
            var caracterEditar = constantsUtility.getProperty("/CARACTEREDITAR");
            var response = await TasaBackendService.obtenerDatosDstrFlota(codigo, usuario);
            if (response) {
                for (var key in response) {
                    if (distribFlota.hasOwnProperty(key)) {
                        distribFlota[key] = response[key];
                    }
                }
                modelo.setProperty("/DistribFlota/Indicador", caracterEditar);
                modelo.setProperty("/DistribFlota/IntLatPuerto", parseInt(response.LTGEO));
                modelo.setProperty("/DistribFlota/IntLonPuerto", parseInt(response.LNGEO));
                if (!response.DSEMP || !response.INPRP) {
                    var mssg = this.getResourceBundle().getText("PLANTASINEMPRESA");
                    MessageBox.error(mssg);
                }
                modelo.refresh();
                return true;
            } else {
                return false;
            }
        },

        obtenerDatosMareaAnt: async function (marea, codigo) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var mareaAnterior = modelo.getProperty("/MareaAnterior");
            //var utilitario = this.getModel("Utilitario");
            //var dataSesionModel = this.getModel("DataSession");
            var usuario = await this.getCurrentUser();
            var motivosSinZarpe = ["3", "7", "8"]; // motivos sin zarpe
            //var mareaAnterior = this.getModel("MareaAnterior");
            var response = await TasaBackendService.obtenerMareaAnterior(marea, codigo, usuario);
            if (response) {
                if (response.data.length > 0) {
                    var mareaAnt = response.data[0];
                    for (var key in mareaAnt) {
                        if (mareaAnterior.hasOwnProperty(key)) {
                            mareaAnterior[key] = mareaAnt[key];
                        }
                    }
                    if (!motivosSinZarpe.includes(mareaAnt.CDMMA)) {
                        var response1 = await TasaBackendService.obtenerEventoAnterior(parseInt(mareaAnt.NRMAR), usuario);
                        if (response1) {
                            var eventoAnt = response1.data[0];
                            if (eventoAnt) {
                                var evtMarAnt = modelo.getProperty("/MareaAnterior/EventoMarAnt");
                                for (var key in eventoAnt) {
                                    if (evtMarAnt.hasOwnProperty(key)) {
                                        evtMarAnt[key] = eventoAnt[key];
                                    }
                                }
                            }
                        }
                    }
                }
            }
            modelo.refresh();
        },

        obtenerReservasCombustible: async function (marea, codigo) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaEventos = modelo.getProperty("/Eventos/Lista");
            var motivoSinZarpe = ["3", "7", "8"];
            var eveReserCombus = ["4", "5", "6"];
            var visibleNuevo = true;
            var mostrarTab = false;
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            var usuario = await this.getCurrentUser();
            var response = await TasaBackendService.obtenerNroReserva(marea, usuario);
            var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
            var embarcacion = modelo.getProperty("/Cabecera/CDEMB");
            modelo.setProperty("/Config/visibleReserva1", false);
            modelo.setProperty("/Config/visibleReserva2", false);
            modelo.setProperty("/Config/visibleReserva3", false);
            if (response) {
                if (response.data.length > 0) {
                    mostrarTab = true;
                }
            }
            if (!mareaCerrada) {
                if (!motivoSinZarpe.includes(motivoMarea)) {
                    var ultimoEvento = listaEventos[listaEventos.length - 1];
                    var tipoUltEvnt = ultimoEvento.CDTEV;
                    visibleNuevo = eveReserCombus.includes(tipoUltEvnt);
                    if (!mostrarTab && visibleNuevo) {
                        mostrarTab = true;
                    }
                } else {
                    mostrarTab = true;
                }
            }
            modelo.setProperty("/Config/visibleTabReserva", mostrarTab);
            if (mostrarTab) {
                var configReservas = await TasaBackendService.obtenerConfigReservas(usuario);
                if (configReservas) {
                    modelo.setProperty("/ConfigReservas/BWART", configReservas.bwart);
                    modelo.setProperty("/ConfigReservas/MATNR", configReservas.matnr);
                    modelo.setProperty("/ConfigReservas/WERKS", configReservas.werks);
                    modelo.setProperty("/ConfigReservas/Almacenes", configReservas.almacenes);
                }
                var embaComb = await TasaBackendService.obtenerEmbaComb(usuario, embarcacion);
                if (embaComb) {
                    if (embaComb.data) {
                        var emba = embaComb.data[0];
                        var objEmbComb = modelo.getProperty("/EmbaComb");
                        for (var key in emba) {
                            if (objEmbComb.hasOwnProperty(key)) {
                                objEmbComb[key] = emba[key];
                            }
                        }
                    }
                }
                await this.obtenerReservas(visibleNuevo);
                /*if (!mareaCerrada) {
                    await this.obtenerReservas(visibleNuevo);
                }else{
                    modelo.setProperty("/ReservasCombustible", reservas);
                    modelo.setProperty("/Config/visibleReserva3", true);
                }*/
            }

        },

        obtenerReservas: async function (visibleNuevo) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var usuario = await this.getCurrentUser();
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            var response = await TasaBackendService.obtenerReservas(marea, null, null, usuario);
            modelo.setProperty("/Config/visibleReserva1", false);
            modelo.setProperty("/Config/visibleReserva2", false);
            modelo.setProperty("/Utils/TxtBtnSuministro", "Reservar");
            if (response) {
                var reservas = response.t_reservas;
                if (reservas.length != 0) {
                    modelo.setProperty("/Config/visibleReserva2", true);
                    if (visibleNuevo) {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", true);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", false);
                    }
                    for (let index = 0; index < reservas.length; index++) {
                        const element = reservas[index];
                        element.CHKDE = false;
                    }
                    modelo.setProperty("/ReservasCombustible", reservas);
                    if (mareaCerrada) {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", false);
                        modelo.setProperty("/Config/visibleAnulaReserva", false);
                        modelo.setProperty("/Config/visibleCheckReserva", false);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", true);
                        modelo.setProperty("/Config/visibleAnulaReserva", true);
                        modelo.setProperty("/Config/visibleCheckReserva", true);
                    }
                } else {
                    await this.obtenerNuevoSuministro(true);
                }
            }
            BusyIndicator.hide();
        },

        obtenerNuevoSuministro: async function (visible) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var usuario = await this.getCurrentUser();
            var eventos = modelo.getProperty("/Eventos/Lista");
            modelo.setProperty("/Config/visibleReserva1", visible);
            modelo.setProperty("/Config/visibleVenta2", visible);
            var ultimoEvento = eventos.length > 0 ? eventos[eventos.length - 1] : null;
            var descEvento = ultimoEvento ? ultimoEvento.DESC_CDTEV : "";
            var fechIniEve = ultimoEvento ? ultimoEvento.FIEVN : "";
            var numeroEvt = ultimoEvento ? ultimoEvento.NREVN : "";
            modelo.setProperty("/Cabecera/NREVN", numeroEvt);
            modelo.setProperty("/Cabecera/DESC_CDTEV", descEvento);
            modelo.setProperty("/Cabecera/FIEVN", fechIniEve);
            var planta = ultimoEvento ? ultimoEvento.CDPTA : "";
            var descr = ultimoEvento ? ultimoEvento.DESCR : "";
            var centro = modelo.getProperty("/ConfigReservas/WERKS");
            var material = modelo.getProperty("/ConfigReservas/MATNR");
            var data = await TasaBackendService.obtenerSuministro(usuario, material);
            if (data) {
                var suministro = data.data[0];
                var dsalm = "";
                var cdale = "";
                var almacenes = modelo.getProperty("/ConfigReservas/Almacenes");
                for (let index = 0; index < almacenes.length; index++) {
                    const element = almacenes[index];
                    if (element.DSALM == descr) {
                        dsalm = element.DSALM;
                        cdale = element.CDALE;
                    }
                }
                var listaSuministro = [{
                    NRPOS: "001",
                    CDSUM: suministro.CDSUM,
                    CNSUM: 0,
                    MAKTX: suministro.MAKTX,
                    CDUMD: suministro.CDUMD,
                    DSUMD: suministro.DSUMD,
                    CDPTA: planta,
                    DESCR: descr,
                    WERKS: centro,
                    DSALM: dsalm,
                    CDALE: cdale
                }];
                modelo.setProperty("/Suministro", listaSuministro);
            }
        },

        obtenerVentasCombustible: async function (marea) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaEventos = modelo.getProperty("/Eventos/Lista");
            console.log("EVENTOS: ", listaEventos);
            var mostrarTab = false;
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            var usuario = await this.getCurrentUser();
            var embarcacion = modelo.getProperty("/Cabecera/CDEMB");
            var nroVenta = await TasaBackendService.obtenerNroReserva(marea, usuario);
            if (nroVenta) {
                mostrarTab = true;
            }
            var primerRegVenta = !mostrarTab;
            var regVenta = false;
            var tipoEvento = "";
            if (!mareaCerrada) {
                for (let index = 0; index < listaEventos.length; index++) {
                    const element = listaEventos[index];
                    tipoEvento = element.CDTEV;
                    if (tipoEvento == "5") {
                        //setear centro de planta de suministro
                        regVenta = true;
                        break;
                    }
                }
                if (regVenta) {
                    mostrarTab = true;
                } else {
                    mostrarTab = false;
                }
            }
            console.log("MOST5RAR TAB: ", mostrarTab);
            modelo.setProperty("/Config/visibleTabVenta", mostrarTab);
            if (mostrarTab) {
                var configReservas = await TasaBackendService.obtenerConfigReservas(usuario);
                if (configReservas) {
                    modelo.setProperty("/ConfigReservas/BWART", configReservas.bwart);
                    modelo.setProperty("/ConfigReservas/MATNR", configReservas.matnr);
                    modelo.setProperty("/ConfigReservas/WERKS", configReservas.werks);
                    modelo.setProperty("/ConfigReservas/Almacenes", configReservas.almacenes);
                }
                var embaComb = await TasaBackendService.obtenerEmbaComb(usuario, embarcacion);
                if (embaComb) {
                    if (embaComb.data) {
                        var emba = embaComb.data[0];
                        var objEmbComb = modelo.getProperty("/EmbaComb");
                        for (var key in emba) {
                            if (objEmbComb.hasOwnProperty(key)) {
                                objEmbComb[key] = emba[key];
                            }
                        }
                    }
                }
                await this.obtenerVentas(primerRegVenta);
            }
        },

        obtenerVentas: async function (primerRegVenta) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var usuario = await this.getCurrentUser();
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            modelo.setProperty("/Config/visibleVenta1", false);
            modelo.setProperty("/Config/visibleVenta2", false);
            modelo.setProperty("/Utils/TxtBtnSuministro", "Vender");
            var response = await TasaBackendService.obtenerReservas(marea, null, null, usuario);
            if (response) {
                var ventas = response.t_reservas;
                if (ventas.length != 0) {
                    modelo.setProperty("/Config/visibleVenta1", true);
                    if (primerRegVenta) {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", true);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", false);
                    }
                    for (let index = 0; index < ventas.length; index++) {
                        const element = ventas[index];
                        element.CHKDE = false;
                    }
                    modelo.setProperty("/VentasCombustible", ventas);
                    if (mareaCerrada) {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", false);
                        modelo.setProperty("/Config/visibleAnulaVenta", false);
                        modelo.setProperty("/Config/visibleCheckVenta", false);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", true);
                        modelo.setProperty("/Config/visibleAnulaVenta", true);
                        modelo.setProperty("/Config/visibleCheckVenta", true);
                    }
                } else {
                    await this.obtenerNuevoSuministro(true);
                }
            }

            BusyIndicator.hide();
        },
        selectionChanged: function (oEvent) {
			var oBar = oEvent.getParameter("bar");
            var Propiedad=this.getModel().getProperty("/Propiedad");
            var cantidad=0;

            var n=false;
            if(oBar.getLabel() =="Propias"){
                cantidad=Propiedad[0].cantidad;
            }
            if(oBar.getLabel() =="Terceros"){
                cantidad=Propiedad[1].cantidad;

            }
            if(oBar.getLabel() =="Ninguno"){
                cantidad=Propiedad[2].cantidad;
                n=true;
            }

            MessageToast.show("Se encontró "+ cantidad +" embarcaciones "+(!n ? oBar.getLabel(): " sin indicador de propiedad"));
            oBar.setSelected(false);
			//MessageToast.show("The selection changed: " + oBar.getLabel() +" "+cantidad + " " + ((oBar.getSelected()) ? "selected" : "deselected"));
		}
	});

});
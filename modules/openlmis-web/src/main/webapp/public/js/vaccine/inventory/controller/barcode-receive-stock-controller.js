/*
 * Electronic Logistics Management Information System (eLMIS) is a supply chain management system for health commodities in a developing country setting.
 *
 * Copyright (C) 2015 Clinton Health Access Initiative (CHAI). This program was produced for the U.S. Agency for International Development (USAID). It was prepared under the USAID | DELIVER PROJECT, Task Order 4.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


function BarcodeReceiveStockController($scope,$filter,$http, Lot,StockCards,manufacturers,UpdateOrderRequisitionStatus,$timeout,$window,$dialog,configurations,homeFacility,SaveDistribution,VaccineProgramProducts,FacilityTypeAndProgramProducts,Distribution,DistributionWithSupervisorId, ProductLots,StockEvent,localStorageService,$location, $anchorScroll) {

    $scope.hasStock=homeFacility.hasStock;
    $scope.userPrograms=configurations.programs;
    $scope.facilityDisplayName=homeFacility.name;
    $scope.homeFacilityId=homeFacility.id;
    $scope.receivedProducts=[];
    $scope.productToAdd={};
    $scope.productToAdd.lots=[];
    $scope.lotToAdd={};
    $scope.vvmStatuses=[{"value":1,"name":" 1 "},{"value":2,"name":" 2 "}];
    $scope.voucherNumberSearched=false;
    $scope.productsConfiguration=configurations.productsConfiguration;
    $scope.period=configurations.period;
    $scope.manufacturers = manufacturers;


    //////////////////////////////////////////////////////////////////////
    ///////////Codes added by kelvin/ //////////////////////////////////
    /////////////////////////////////////////////////////////////////
    //load all packaging details
    $http.get('/vaccine/gitn_lookup/all').success(function(data) {
        $scope.gtin_lookups = data.gitn_lookup;
    }).
    error(function(data) {
        console.log("Error:" + data);
    });

    $timeout(function(){
        $("#barcode_string").focus();
    });

    //react to scanning of barcode
    $scope.data = {};
    $scope.data.loading_item = false;
    $scope.data.allowMultipleScan = true;
    $scope.useBarcode = true;
    $scope.scanLotNumber = function(barcodeString ){
        if(barcodeString !== ""){
            $scope.barcode ={};
            $scope.barcode.lot_number = "";
            $scope.barcode.gtin = "";
            $scope.barcode.expiry = "";
            //check for the GS1 character
            if(barcodeString.substring(0,3) === "]d2"){
                if(barcodeString.length > 45){
                    var n = barcodeString.lastIndexOf("21");
                    $scope.barcode.expiry = barcodeString.substring(21,27);
                    $scope.barcode.gtin = barcodeString.substring(5,19);
                    $scope.barcode.lot_number = barcodeString.substring(29,n);
                }else if(barcodeString.length >= 29){
                    $scope.barcode.lot_number = barcodeString.substring(29);
                    $scope.barcode.expiry = barcodeString.substring(21,27);
                    $scope.barcode.gtin = barcodeString.substring(5,19);
                }else{
                    $scope.data.error_loading_gtin = true;
                    $timeout(function(){
                        $scope.data.error_loading_gtin = false;
                    },2000);
                    $scope.data.error_loading_item = false;
                    $scope.data.loading_item = false;
                }
            }else if(barcodeString.substring(0,2) === "01"){
                if(barcodeString.length > 45){
                    var n = barcodeString.lastIndexOf("21");
                    $scope.barcode.expiry = barcodeString.substring(18,24);
                    $scope.barcode.gtin = barcodeString.substring(2,16);
                    $scope.barcode.lot_number = barcodeString.substring(26,n);
                }else if(barcodeString.length >= 29){
                    $scope.barcode.lot_number = barcodeString.substring(26);
                    $scope.barcode.expiry = barcodeString.substring(18,24);
                    $scope.barcode.gtin = barcodeString.substring(2,16);
                }else{
                    $scope.data.error_loading_gtin = true;
                    $timeout(function(){
                        $scope.data.error_loading_gtin = false;
                    },2000);
                    $scope.data.error_loading_item = false;
                    $scope.data.loading_item = false;
                }

            }else{
                $scope.data.error_loading_gtin = true;
                $timeout(function(){
                    $scope.data.error_loading_gtin = false;
                },2000);
                $scope.data.error_loading_item = false;
                $scope.data.loading_item = false;
            }

            $scope.data.loading_item = true;

            $scope.barcode.formatedDate = $scope.formatDate(new Date("20"+$scope.barcode.expiry.replace(/(.{2})/g,"$1-").slice(0, -1)));
            $scope.current_item = $scope.getItemByGTIN($scope.barcode.gtin);
            if($scope.current_item.available === false){
                $scope.data.error_loading_item = true;
                $timeout(function(){
                    $scope.data.error_loading_gtin = false;
                },2000);
                $scope.data.loading_item = false;
            }else{
                $scope.data.error_loading_item = false;
                $scope.data.loading_item = false;
                $scope.data.show_singleItem = true;
                $scope.data.process_package = false;
            }
        }

    };

    //finding an item from the gtin Lookup table
    $scope.getItemByGTIN = function(gitn){
        var item = {available:false};
        angular.forEach($scope.gtin_lookups,function(value){
            if(gitn == value.gtin){
                item.available = true;
                angular.forEach($scope.productsToDisplay,function(product){
                    if(value.productid == product.programProduct.product.id){
                        //check if lot is available in the system
                        $scope.barcode.manufacturename = value.manufacturename;
                        $scope.productToAdd.product = product.programProduct.product;
                        product.programProduct.product.packaging = value;
                        $scope.prepareProductLots($scope.productToAdd.product);
                    }
                });
            }
        });
        return item;
    };

    $scope.addProductFromBarcodeScanner = function(){
        $scope.lotToAdd.lot = $scope.lotToUse;
        $scope.lotToAdd.vvmStatus = '';
        $scope.lotToAdd.quantity = '';
        $scope.lotToAdd.boxes_quantity = '';
        $scope.lotToAdd.vials_quantity = '';
        if($scope.data.allowMultipleScan){
            $scope.lotToAdd.boxes_quantity = 1;
        }
        $scope.productToAdd.quantity = '';
        $scope.productToAdd.lots.push($scope.lotToAdd);


        //add product for display
        if($scope.isProductInList($scope.productToAdd.product.id,$scope.receivedProducts)){
            if($scope.data.allowMultipleScan){
                $scope.updateValue($scope.productToAdd.lots[0],$scope.productToAdd);
            }
            $scope.receivedProducts.push($scope.productToAdd);
        }else{
            angular.forEach($scope.receivedProducts,function(value){
                if(value.product.id === $scope.productToAdd.product.id){
                    var checkLot = $scope.isLotInProduct($scope.lotToAdd.lot.lotCode,value.lots);
                    if(checkLot.available){
                        value.lots.push($scope.lotToAdd);
                        if($scope.data.allowMultipleScan){
                            $scope.updateValue(value.lots[value.lots.length - 1],value);
                        }
                    }else{
                        if($scope.data.allowMultipleScan){
                            value.lots[checkLot.key].boxes_quantity++;
                            $scope.updateValue(value.lots[checkLot.key],value);
                        }
                    }
                }
            });
        }
        $scope.lotToAdd={};

        $scope.productToAdd={};
        $scope.productToAdd.lots=[];
        $scope.barcode_string = "";

        //reset the item to blank after scanning
        $("#barcode_string").val('');
        angular.element(jQuery('#barcode_string')).triggerHandler('input');
    };

    //update doses when product boxes and loose vials change
    $scope.updateValue  = function(lot,product){
        var vials_per_box = product.product.packaging.vialsperbox;
        var doses_per_vials = product.product.packaging.dosespervial;
        var boxes = (lot.boxes_quantity === '')?0:lot.boxes_quantity;
        var vials = (lot.vials_quantity === '')?0:lot.vials_quantity;
        var num = 0;
        if(boxes != 0){
            num += boxes*vials_per_box*doses_per_vials;
        }if(vials != 0){
            if(vials >= vials_per_box){
                lot.boxes_quantity = lot.boxes_quantity + Math.floor(vials / vials_per_box)
                vials = vials % vials_per_box;
                lot.vials_quantity = vials % vials_per_box;
            }
            num += doses_per_vials*vials;
        }
        lot.quantity = num;
    };

    $scope.prepareProductLots=function(product)
    {
        $scope.lotsToDisplay={};
        $scope.productToAdd.lot="";
        if(product !==null)
        {
            var id=product.id;
            config=_.filter(configurations.productsConfiguration, function(obj) {
                return obj.product.id===id;
            });
            if(config.length > 0)
            {
                $scope.productToAdd.batchTracked=config[0].batchTracked;
                $scope.productToAdd.vvmTracked=config[0].vvmTracked;
            }
            else if(config.length ===0){
                $scope.productToAdd.batchTracked=true;
                $scope.productToAdd.vvmTracked=false;
            }
            if($scope.productToAdd.batchTracked)
            {
                ProductLots.get({productId:product.id},function(data){
                    $scope.allLots=data.lots;
                    $scope.lotsToDisplay=$scope.allLots;
                    var checkLot = $scope.isLotInSystem($scope.barcode.lot_number,$scope.allLots);
                    if(checkLot.available){
                        //add new lot and display message//
                        var newLot={};
                        newLot.product=product;
                        newLot.lotCode=$scope.barcode.lot_number;
                        newLot.manufacturerName=$scope.barcode.manufacturename;
                        newLot.expirationDate=$scope.barcode.formatedDate;
                        Lot.create(newLot,function(data){
                            //$scope.loadProductLots(product).
                            $scope.lotToUse = data.lot;
                            $scope.addProductFromBarcodeScanner();
                            console.log("this lot was not in the system it has been added");
                            //$scope.productToAdd.lot=data.lot;
                        });
                    }else{
                        $scope.lotToUse = checkLot.lot;
                        $scope.addProductFromBarcodeScanner();

                    }
                });
            }

        }
    };

    //update boxes and vials when changes in doses
    $scope.updateQuantity = function (lot,product) {
        var vials_per_box = product.product.packaging.vialsperbox;
        var doses_per_vials = product.product.packaging.dosespervial;
        var dosesInBox = vials_per_box*doses_per_vials;
        console.log(dosesInBox);
        lot.boxes_quantity = parseInt(lot.quantity / dosesInBox);
        lot.vials_quantity = lot.quantity % dosesInBox;
    };

    //check if product has that lot already
    $scope.isLotInProduct = function (lot,arr) {
        var control = {available:true,lot:{}};
        angular.forEach(arr,function(value,key){
            if(value.lot.lotCode === lot){
                control.available = false;
                control.key = key;
            }
        });
        return control;
    };

    //check if product is already in list
    $scope.isProductInList = function (productId,arr) {
        var control = true;
        angular.forEach(arr,function(value){
            if(value.product.id === productId){
                control = false;
            }
        });
        return control;
    };

    //check if the scanned lot is in the system
    $scope.isLotInSystem = function (lot,arr) {
        var control = {available:true,lot:{}};
        angular.forEach(arr,function(value){
            if(value.lotCode === lot){
                control.available = false;
                control.lot = value;
            }
        });
        return control;
    };

    //a function to format date from the GTIN String
    $scope.formatDate = function (date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2){ month = '0' + month;}
        if (day.length < 2) { day = '0' + day; }

        return [year, month, day].join('-');
    };

    //switching between Normal and Barcode format
    $scope.switchBarcodeToNormal = function(){
      if($scope.useBarcode){
          $scope.productsToDisplay=$scope.allProducts;
          angular.forEach($scope.receivedProducts,function(product){
              angular.forEach($scope.gtin_lookups,function(package){
                 if(package.productid == product.product.id){
                     product.product.packaging = package;
                 }
              });
              if(product.product.packaging){
                  angular.forEach(product.lots,function(lot){
                      $scope.updateQuantity(lot,product);
                  });
              }

          })
          $("#barcode_string").focus();
      }else{
          updateProductToDisplay($scope.receivedProducts);
      }
    };


    $scope.loadProducts=function(facilityId,programId){
        FacilityTypeAndProgramProducts.get({facilityId:facilityId, programId:programId},function(data){
            var allProducts=data.facilityProduct;
            $scope.allProducts=_.sortBy(allProducts,function(product){
                return product.programProduct.product.id;
            });
            $scope.productsToDisplay=$scope.allProducts;
        });

        VaccineProgramProducts.get({programId:programId},function(data){
            $scope.productsWithPresentation=data.programProductList;
        });
    };

    $scope.getPresentation=function(product)
    {
        var productWithPresentation = _.filter($scope.productsWithPresentation, function (obj) {
            return obj.product.primaryName === product.primaryName;
        });
        if(productWithPresentation.length === 1)
        {
            return productWithPresentation[0].product.dosesPerDispensingUnit;
        }
        else
        {
            return 1;
        }
    };
    $scope.loadProductLots=function(product)
    {
        $scope.lotsToDisplay={};
        $scope.productToAdd.lot=undefined;
        if(product !==null)
        {
            var id=product.id;
            config=_.filter(configurations.productsConfiguration, function(obj) {
                return obj.product.id===id;
            });
            if(config.length > 0)
            {
                $scope.productToAdd.batchTracked=config[0].batchTracked;
                $scope.productToAdd.vvmTracked=config[0].vvmTracked;
            }
            else if(config.length ===0){
                $scope.productToAdd.batchTracked=true;
                $scope.productToAdd.vvmTracked=false;
            }
            if($scope.productToAdd.batchTracked)
            {
                ProductLots.get({productId:product.id},function(data){
                    $scope.allLots=data.lots;
                    $scope.lotsToDisplay=$scope.allLots;
                });
            }
        }
    };

    $scope.receive=function()
    {
        var callBack=function(result)
        {
            if(result)
            {
                var events=[];
                $scope.distribution.lineItems.forEach(function(p){
                    if(p.lots !==undefined && p.lots.length >0)
                    {
                        p.lots.forEach(function(l){
                            var event={};
                            event.type="RECEIPT";
                            event.facilityId=homeFacility.id;
                            event.productCode=p.product.code;
                            event.quantity=l.quantity;
                            event.lot={};
                            event.lot.lotCode=l.lot.lotCode;
                            event.lot.manufacturerName=l.lot.manufacturerName;
                            event.lot.expirationDate=l.lot.expirationDate;
                            event.occurred=$scope.occurredDate;
                            event.customProps={};
                            if(l.vvmStatus !==undefined)
                            {
                                event.customProps.vvmStatus=l.vvmStatus;
                            }
                            event.customProps.receivedFrom=$scope.distribution.fromFacility.name;
                            event.customProps.occurred=$scope.occurredDate;
                            events.push(event);
                        });
                    }
                    else{
                        var event={};
                        event.type="RECEIPT";
                        event.facilityId=homeFacility.id;
                        event.productCode=p.product.code;
                        event.quantity=p.quantity;
                        if(p.vvmStatus !==undefined)
                        {
                            event.customProps={"vvmStatus":p.vvmStatus};
                        }
                        event.customProps.receivedFrom=$scope.distribution.fromFacility.name;
                        event.occurred=$scope.occurredDate;
                        event.customProps.occurred=$scope.occurredDate;
                        events.push(event);
                    }

                });

                StockEvent.update({facilityId:homeFacility.id},events, function (data) {
                    if(data.success)
                    {
                        $scope.message=true;
                        $scope.distribution.status='RECEIVED';
                        $scope.distribution.programId=$scope.selectedProgramId;
                        SaveDistribution.save($scope.distribution,function(distribution){
                            if($scope.distribution.orderId !== null)
                            {
                                UpdateOrderRequisitionStatus.update({orderId: $scope.distribution.orderId}, function () {
                                });
                            }
                            $timeout(function(){
                                $window.location='/public/pages/vaccine/inventory/dashboard/index.html#/stock-on-hand';
                            },900);
                        });

                    }
                });

            }
        };
        var options = {
            id: "confirmDialog",
            header: "label.confirm.receive.stock.action",
            body: "msg.question.receive.stock.confirmation"
        };
        OpenLmisDialog.newDialog(options, callBack, $dialog);

    };

    $scope.openReceive=function(){
        var callBack=function(result)
        {
            if(result)
            {
                var distribution={};
                var today=new Date();
                DistributionWithSupervisorId.get({facilityId:homeFacility.id},function(data){
                    var existingDistribution=(data.distribution !==null)?data.distribution:undefined;
                    var supervisorId=(data.supervisorId !== null)?data.supervisorId:undefined;
                    distribution=new VaccineDistribution(existingDistribution, $scope.receivedProducts,$scope.orderNumber,$scope.orderDate,supervisorId,$scope.homeFacilityId,$scope.selectedProgramId);
                });

                var events=[];

                $scope.receivedProducts.forEach(function(p){
                    if(p.lots !==undefined && p.lots.length >0)
                    {
                        p.lots.forEach(function(l){
                            var event={};
                            event.type="RECEIPT";
                            event.facilityId=homeFacility.id;
                            event.productCode=p.product.code;
                            event.quantity=l.quantity;
                            event.lot={};
                            event.lot.lotCode=l.lot.lotCode;
                            event.lot.manufacturerName=l.lot.manufacturerName;
                            event.lot.expirationDate=l.lot.expirationDate;
                            event.occurred=($scope.hasStock)?$scope.orderDate:today;
                            event.customProps={};
                            if(l.vvmStatus !==undefined)
                            {
                                event.customProps.vvmStatus=l.vvmStatus;
                            }
                            event.customProps.receivedFrom="";
                            event.customProps.occurred=($scope.hasStock)?$scope.orderDate:today;
                            events.push(event);
                        });
                    }
                    else{
                        var event={};
                        event.type="RECEIPT";
                        event.facilityId=homeFacility.id;
                        event.productCode=p.product.code;
                        event.quantity=p.quantity;
                        event.occurred=($scope.hasStock)?$scope.orderDate:today;
                        event.customProps={};
                        if(p.vvmStatus !==undefined)
                        {
                            event.customProps.vvmStatus=p.vvmStatus;
                        }
                        event.customProps.occurred=($scope.hasStock)?$scope.orderDate:today;
                        events.push(event);
                    }

                });


                StockEvent.update({facilityId:homeFacility.id},events, function (data) {
                    if(data.success && $scope.hasStock)
                    {
                        SaveDistribution.save(distribution,function(distribution){

                        });
                    }
                    $scope.message=true;
                    $timeout(function(){
                        $window.location='/public/pages/vaccine/inventory/dashboard/index.html#/stock-on-hand';
                    },900);
                });

            }
        };
        var options = {
            id: "confirmDialog",
            header: "label.confirm.receive.stock.action",
            body: "msg.question.receive.stock.confirmation"
        };
        OpenLmisDialog.newDialog(options, callBack, $dialog);
    };




    $scope.cancel=function(){
        $window.location='/public/pages/vaccine/inventory/dashboard/index.html#/stock-on-hand';
    };
    if($scope.userPrograms.length > 1)
    {
        $scope.showPrograms=true;
        //TODO: load stock cards on program change
        $scope.selectedProgram=$scope.userPrograms[0];
        $scope.loadProducts(homeFacility.id,$scope.userPrograms[0].id);
        $scope.selectedProgramId=$scope.userPrograms[0].id;
    }
    else if($scope.userPrograms.length === 1){
        $scope.showPrograms=false;
        $scope.selectedProgramId=$scope.userPrograms[0].id;
        $scope.loadProducts(homeFacility.id,$scope.userPrograms[0].id);
    }

    $scope.removeProduct=function(product)
    {
        var index = $scope.receivedProducts.indexOf(product);
        $scope.receivedProducts.splice(index, 1);
        updateProductToDisplay($scope.receivedProducts);
    };

    $scope.addProduct=function(productToAdd){
        $scope.receivedProducts.push(productToAdd);
        $scope.productToAdd={};
        $scope.productToAdd.lots=[];
        updateProductToDisplay($scope.receivedProducts);
        $location.hash('scroll-to-lot');
        $anchorScroll();
    };

    //add lots
    $scope.addLot=function(lotToAdd){
        $scope.productToAdd.lots.push(lotToAdd);
        $scope.lotToAdd={};
        updateLotsToDisplay($scope.productToAdd.lots);
        $location.hash('scroll-to-lot');
        $anchorScroll();
    };

    $scope.removeProductLot=function(lot){
        var index = $scope.productToAdd.lots.indexOf(lot);
        $scope.productToAdd.lots.splice(index, 1);
        updateLotsToDisplay($scope.productToAdd.lots);
    };


    $scope.removeReceivedLot=function(product,lot)
    {
        if(product.lots.length ===1)
        {
            $scope.removeProduct(product);
        }
        else{
            var productIndex = $scope.receivedProducts.indexOf(product);
            var lotIndex = $scope.receivedProducts[productIndex].lots.indexOf(lot);
            $scope.receivedProducts[productIndex].lots.splice(lotIndex, 1);
        }
    };


    function updateProductToDisplay(receivedProducts)
    {
        var toExclude = _.pluck(_.pluck(receivedProducts, 'product'), 'primaryName');
        $scope.productsToDisplay = $.grep($scope.allProducts, function (productObject) {
            return $.inArray(productObject.programProduct.product.primaryName, toExclude) == -1;
        });
    }

    function updateLotsToDisplay(lotsToAdd)
    {
        var toExclude = _.pluck(_.pluck(lotsToAdd, 'lot'), 'lotCode');
        $scope.lotsToDisplay = $.grep($scope.allLots, function (lotObject) {
            return $.inArray(lotObject.lotCode, toExclude) == -1;
        });
    }



    $scope.loadRights = function () {
        $scope.rights = localStorageService.get(localStorageKeys.RIGHT);
    }();

    $scope.hasPermission = function (permission) {
        if ($scope.rights !== undefined && $scope.rights !== null) {
            var rights = JSON.parse($scope.rights);
            var rightNames = _.pluck(rights, 'name');
            return rightNames.indexOf(permission) > -1;
        }
        return false;
    };

    $scope.sumLots = function(product) {
        var total=0;
        angular.forEach(product.lots , function(lot){
            total+= parseInt(lot.quantity,10);
        });
        product.quantity=total;
        return total;
    };
    $scope.loadDistribution=function(){
        $scope.distribution=undefined;
        Distribution.get({voucherNumber:$scope.receivedProducts.voucherNumber},function(data){
            if(data.distribution !==null){
                $scope.distribution=data.distribution;
            }
            else{
                $scope.distribution=undefined;
                $scope.voucherNumberSearched=true;
            }
        });

    };

    $scope.clear=function(){
        $scope.distribution=undefined;
        $scope.voucherNumberSearched=false;
    };

    $scope.showNewLotModal=function(product){
        $scope.newLotModal=true;
        $scope.newLot={};
        $scope.newLot.product=product.product;
    };

    $scope.closeNewLotModal=function(){
        $scope.newLot={};
        $scope.newLotModal=false;
    };
    $scope.createLot=function(){
        var newLot={};
        newLot.product=$scope.newLot.product;
        newLot.lotCode=$scope.newLot.lotCode;
        newLot.manufacturerName=$scope.newLot.manufacturerName;
        newLot.expirationDate=$filter('date')($scope.newLot.expirationDate,"yyyy-MM-dd");
        Lot.create(newLot,function(data){
            $scope.newLotModal=false;
            $scope.loadProductLots(data.lot.product);
            //$scope.productToAdd.lot=data.lot;
        });
    };

}
BarcodeReceiveStockController.resolve = {

    homeFacility: function ($q, $timeout,UserFacilityList,StockCards) {
        var deferred = $q.defer();
        var homeFacility={};

        $timeout(function () {
            UserFacilityList.get({}, function (data) {
                homeFacility = data.facilityList[0];
                StockCards.get({facilityId:homeFacility.id},function(data){
                    if(data.stockCards.length> 0)
                    {
                        homeFacility.hasStock=true;
                    }
                    else{
                        homeFacility.hasStock=false;
                    }
                    deferred.resolve(homeFacility);
                });

            });

        }, 100);
        return deferred.promise;
    },
    configurations:function($q, $timeout, AllVaccineInventoryConfigurations) {
        var deferred = $q.defer();
        var configurations={};
        $timeout(function () {
            AllVaccineInventoryConfigurations.get(function(data)
            {
                configurations=data;
                deferred.resolve(configurations);
            });
        }, 100);
        return deferred.promise;
    },
    manufacturers : function($q, $timeout, $route, ManufacturerList){
        var deferred = $q.defer();

        $timeout(function () {
            ManufacturerList.get(function (data) {
                deferred.resolve(data.manufacturers);
            });
        }, 100);
        return deferred.promise;
    }
};
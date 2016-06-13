(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('elmisBarcodeLibray.config', [])
      .value('elmisBarcodeLibray.config', {
          debug: true
      });

  // Modules
  angular.module('elmisBarcodeLibray.directives', []);
  angular.module('elmisBarcodeLibray.filters', []);
  angular.module('elmisBarcodeLibray.services', []).factory('barcodeService',function($http,$q){
    var barcodeService = {
      //base application url (http://localhost:9091)
      baseUrl:"",

      //language settings (default en)
      lang:"en",

      //selecting whether to log scanned values or not
      enableLogging:false,

      //determine the position of metadata using prefix [dx,de,co,pe,ou]
      getTitleIndex: function(){

      },

      /**
       * Get the details of the GS1 data matrix barcode
       * @param barcode
       */
      getBarcodeDetails: function(barcode){

      },

      /**
       * Get the product details from the scaning GS1 data matrix barcode
       * @param barcode
       */
      getProductDetails: function(barcode){

      },

      /**
       *create a gs1 datamatrix from raw data
       * @param gtin
       * @param expirydate
       * @param batchnumber
       * @param serialnumber
       */
       createBarcodeString: function(gtin,expirydate, batchnumber, serialnumber){

      },

      /**
       *get the details of the shipment to be received at national level
       * @param awbnumber
       */
       getShipmentDetails: function(awbnumber){

      },

      /**
       * Get the details of dispatches
       * @param vouchernumber
       */
      getDispatchDetails: function(vouchernumber){

      }

    };
    return barcodeService;
  });
  ;
  angular.module('elmisBarcodeLibray',
      [
          'elmisBarcodeLibray.config',
          'elmisBarcodeLibray.directives',
          'elmisBarcodeLibray.filters',
          'elmisBarcodeLibray.services',
          'ngResource',
          'ngSanitize'
      ]);

})(angular);

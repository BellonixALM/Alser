// ВСТАНОВІТЬ ID ВАШОЇ ТАБЛИЦІ ТУТ, ЯКЩО СКРИПТ НЕ ПРИВ'ЯЗАНИЙ ДО ТАБЛИЦІ НАПРЯМУ
// (Наприклад, скопіюйте з посилання вашої таблиці: '1EJvpjldQvx5-gtQnaBfs33VDEy4jxx9sgBayrteHMIWpeH-8l2a0bVqw')
var SPREADSHEET_ID = '15SJusCGSNbupL69fy7LH3A_HpmzjePBgfcLF--C7Zkk';

// ТОКЕН ВАШОГО TELEGRAM БОТА ДЛЯ АВТОМАТИЧНИХ СПОВІЩЕНЬ
var BOT_TOKEN = ''; // Disabled for now

function getSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("Не вдалося отримати активну таблицю: " + e.toString());
  }
  
  if (!ss && SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log("Не вдалося відкрити таблицю за ID: " + e.toString());
    }
  }
  return ss;
}

function sendTelegramMessage(chatId, text, replyMarkup) {
  if (typeof SKIP_BOT !== 'undefined' && SKIP_BOT) return;
  if (!BOT_TOKEN || !chatId) return;
  try {
    var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
    var payload = {
      "chat_id": chatId,
      "text": text,
      "parse_mode": "HTML"
    };
    
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    
    var resp = UrlFetchApp.fetch(url, {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    });
    return resp.getContentText();
  } catch (e) {
    Logger.log("Помилка відправки Telegram: " + e.toString());
    return "Error: " + e.toString();
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var callback = e.parameter.callback || 'callback';
    var payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
    var result = {};
    
    try {
      if (action === 'login') {
        result = authenticateUser(payload.login, payload.password);
      } else if (action === 'getDeliveries') {
        result = { status: 'success', data: getDeliveries() };
      } else if (action === 'getDrivers') {
        result = { status: 'success', data: getDrivers() };
      } else if (action === 'addDelivery') {
        result = addDelivery(payload);
      } else if (action === 'updateDeliveryStatus') {
        result = updateDeliveryStatus(payload.deliveryId, payload.newStatus, payload.comment);
      } else if (action === 'updateDeliveryDetails') {
        result = updateDeliveryDetails(payload.deliveryId, payload.deliveryData, payload.userRole);
      } else if (action === 'updateDriverPhoto') {
        result = updateDriverPhoto(payload.carId, payload.imageBase64);
      } else if (action === 'getDailyCrews') {
        result = { status: 'success', data: getDailyCrews(payload.dateStr) };
      } else if (action === 'saveDailyCrew') {
        result = saveDailyCrew(payload.dateStr, payload.crews);
      } else if (action === 'get_clients') {
        result = get_clients();
      } else if (action === 'register_driver') {
      return ContentService.createTextOutput(JSON.stringify(register_driver(data.data)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'get_employees') {
        result = get_employees();
      } else if (action === 'saveClient') {
        result = saveClient(payload);
      } else if (action === 'deleteClient') {
        result = deleteClient(payload.id);
      } else if (action === 'saveEmployee') {
        result = saveEmployee(payload);
      } else if (action === 'deleteEmployee') {
        result = deleteEmployee(payload.id);
      } else if (action === 'sync_alser_data') {
        result = syncAlserData();
      } else {
        result = { status: 'error', message: 'Unknown action: ' + action };
      }
    } catch (err) {
      result = { status: 'error', message: err.toString() };
    }
    
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
                         .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  var template = HtmlService.createTemplateFromFile('index');
  template.scriptUrl = ScriptApp.getService().getUrl();
  return template.evaluate()
      .setTitle('Календар Propex')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var SKIP_BOT = true;

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.skip_bot) SKIP_BOT = true;
    var action = data.action;
    
    if (action === 'add_delivery') {
      return ContentService.createTextOutput(JSON.stringify(addDelivery(data.data)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'register_driver') {
      return ContentService.createTextOutput(JSON.stringify(register_driver(data.data)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'get_employees') {
      return ContentService.createTextOutput(JSON.stringify(get_employees()))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'get_deliveries') {
      return ContentService.createTextOutput(JSON.stringify(getDeliveries()))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'get_sheet_names') {
      var ss = getSpreadsheet();
      var sheets = ss.getSheets();
      var names = sheets.map(function(s) { return s.getName(); });
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: names }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'update_status') {
      var result = updateDeliveryStatus(data.data.id, data.data.status, data.data.comment);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'login') {
      var result = authenticateUser(data.data.login, data.data.password);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'update_delivery_details') {
      var result = updateDeliveryDetails(data.data.id, data.data.deliveryData, data.data.userRole);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'assign_warehouse_worker') {
      var result = assignWarehouseWorker(data.data.deliveryId, data.data.workerId);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'test_wh') {
      return ContentService.createTextOutput(JSON.stringify(getWarehouseWorkers()))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'update_warehouse_status') {
      var result = updateWarehouseStatus(data.data.deliveryId, data.data.status);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'sync_alser_data') {
      return ContentService.createTextOutput(JSON.stringify(syncAlserData()))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'update_driver_photo') {
      var result = updateDriverPhoto(data.data.carId, data.data.photoBase64);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'save_daily_crew') {
      // The bot sends {date, car_id, telegram_id, name}
      var result = saveDailyCrew(data.data.date, data.data.car_id, data.data.telegram_id, data.data.name);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'getDailyCrews') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: getDailyCrews() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action: ' + action }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getDeliveries() {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Не вдалося знайти зв'язок з Google Таблицею. Переконайтеся, що скрипт прикріплений до таблиці або вкажіть SPREADSHEET_ID в Code.gs.");
  }
  var sheet = ss.getSheetByName('Заміри');
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row, rowIndex) {
    var obj = {};
    headers.forEach(function(header, index) {
      var val = row[index];
      var h = header.toString().trim().toLowerCase();
      
      // Standardize delivery keys
      if (h === 'id' || h === 'код') {
        obj['ID'] = val;
      } else if (h === 'id_авто' || h === 'id_автомобіля' || h === 'автомобіль' || h === 'авто' || h === 'id_automobile') {
        obj['ID_Авто'] = val;
      } else if (h === 'водій' || h === 'id_водія' || h === 'водія' || h === 'піб_водія' || h === 'ім\'я водія' || h === 'прізвище') {
        obj['Водій'] = val;
      } else if (h === 'дата' || h === 'день') {
        obj['Дата'] = val;
      } else if (h === 'час' || h === 'година') {
        obj['Час'] = val;
      } else if (h === 'адреса' || h === 'пункт призначення') {
        obj['Адреса'] = val;
      } else if (h === 'номер_замовлення' || h === 'замовлення' || h === 'номер замовлення' || h === '№' || h === '№ замовлення') {
        obj['Номер_замовлення'] = val;
      } else if (h === 'статус_оплати' || h === 'оплата' || h === 'статус оплати') {
        obj['Статус_оплати'] = val;
      } else if (h === 'статус' || h === 'стан') {
        obj['Status'] = val; // Store original
        obj['Статус'] = val;
      } else if (h === 'коментар' || h === 'примітки' || h === 'примітка') {
        obj['Коментар'] = val;
      } else if (h.replace(/\s+/g, '_') === 'статус_збору' || h.replace(/\s+/g, '_') === 'статус_склад' || h.replace(/\s+/g, '') === 'статусзбору') {
        obj['Статус_збору'] = val;
        obj[header] = val;
      } else if (h === 'ім\'я_одержувача' || h === 'одержувач' || h === 'отримувач' || h === 'ім’я одержувача') {
        obj['Ім\'я_одержувача'] = val;
      } else if (h === 'телефон_одержувача' || h === 'телефон' || h === 'номер отримувача') {
        obj['Telephone'] = val; // Store original
        obj['Телефон_одержувача'] = val;
      } else if (h === 'тривалість' || h === 'duration') {
        obj['Тривалість'] = val;
      } else if (h === 'тип_виробу' || h === 'тип виробу' || h === 'product_type') {
        obj['Тип_виробу'] = val;
      } else if (h === 'id_менеджера' || h === 'менеджер' || h === 'manager_chat_id' || h === 'manager_id') {
        obj['ID_Менеджера'] = val;
      } else {
        obj[header] = val;
      }
    });
    
    // Ensure all critical standardized keys are present
    if (!obj['ID'] || obj['ID'] === '') obj['ID'] = obj['Код'] || obj['Номер_замовлення'] || String(rowIndex + 2);
    if (!obj['ID_Авто']) {
      obj['ID_Авто'] = obj['ID_Водія'] || obj['ID_Automobile'] || '1';
    }
    if (!obj['Номер_замовлення']) {
      obj['Номер_замовлення'] = obj['Замовлення'] || obj['№'] || '';
    }
    if (!obj['Статус']) {
      obj['Статус'] = 'Заплановано';
    }
    
    return obj;
  });
}

function getClients() {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Не вдалося знайти зв'язок з Google Таблицею. Переконайтеся, що скрипт прикріплений до таблиці або вкажіть SPREADSHEET_ID в Code.gs.");
  }
  var sheet = ss.getSheetByName('Клієнти') || ss.getSheetByName('Clients');
  if (!sheet) {
    // Return empty array if no sheet
    return [];
  }
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = data.slice(1);
  return rows.map(function(row, rowIndex) {
    var obj = {};
    headers.forEach(function(header, index) {
      var val = row[index];
      var h = header.toString().trim().toLowerCase();
      if (h === 'id' || h === 'код' || h === 'номер') {
        obj['ID'] = val;
      } else if (h === 'назва' || h === 'ім\'я' || h === 'name' || h === 'название') {
        obj['Назва'] = val;
      } else if (h === 'контакт' || h === 'телефон' || h === 'phone') {
        obj['Контакт'] = val;
      } else {
        obj[header] = val;
      }
    });
    return obj;
  });
}

function getDrivers() {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Не вдалося знайти зв'язок з Google Таблицею. Переконайтеся, що скрипт прикріплений до таблиці або вкажіть SPREADSHEET_ID в Code.gs.");
  }
  var sheet = ss.getSheetByName('Екіпажі') || ss.getSheetByName('Водії');
  if (!sheet) {
    return [
      { 'ID_Авто': '1', 'Ім\'я': 'Денис Юрасов', 'Фото': '' },
      { 'ID_Авто': '2', 'Ім\'я': 'Свистун Олена', 'Фото': '' },
      { 'ID_Авто': '3', 'Ім\'я': 'Коломієць Руслан', 'Фото': '' },
      { 'ID_Авто': '4', 'Ім\'я': 'Беллонін Микола', 'Фото': '' },
      { 'ID_Авто': '5', 'Ім\'я': 'Захаров Олег', 'Фото': '' },
      { 'ID_Авто': '6', 'Ім\'я': 'Коржов Вячеслав', 'Фото': '' },
      { 'ID_Авто': '7', 'Ім\'я': 'Мартинюк Валерій', 'Фото': '' },
      { 'ID_Авто': '8', 'Ім\'я': 'Сергій Ревука', 'Фото': '' },
      { 'ID_Авто': '9', 'Ім\'я': 'Радіоненко Олена', 'Фото': '' },
      { 'ID_Авто': 'Дистанційні заміри', 'Ім\'я': 'Яків Куликів', 'Фото': '' }
    ];
  }
  
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) {
    return [
      { 'ID_Авто': '1', 'Ім\'я': 'Денис Юрасов', 'Фото': '' },
      { 'ID_Авто': '2', 'Ім\'я': 'Свистун Олена', 'Фото': '' },
      { 'ID_Авто': '3', 'Ім\'я': 'Коломієць Руслан', 'Фото': '' },
      { 'ID_Авто': '4', 'Ім\'я': 'Беллонін Микола', 'Фото': '' },
      { 'ID_Авто': '5', 'Ім\'я': 'Захаров Олег', 'Фото': '' },
      { 'ID_Авто': '6', 'Ім\'я': 'Коржов Вячеслав', 'Фото': '' },
      { 'ID_Авто': '7', 'Ім\'я': 'Мартинюк Валерій', 'Фото': '' },
      { 'ID_Авто': '8', 'Ім\'я': 'Сергій Ревука', 'Фото': '' },
      { 'ID_Авто': '9', 'Ім\'я': 'Радіоненко Олена', 'Фото': '' },
      { 'ID_Авто': 'Дистанційні заміри', 'Ім\'я': 'Яків Куликів', 'Фото': '' }
    ];
  }
  
  var headers = data[0];
  var rows = data.slice(1);
  
  var photoCol = -1;
  headers.forEach(function(header, idx) {
    var h = header.toString().trim().toLowerCase();
    if (h === 'фото' || h === 'аватар' || h === 'зображення') {
      photoCol = idx;
    }
  });

  return rows.map(function(row, i) {
    var obj = {};
    headers.forEach(function(header, index) {
      var val = row[index];
      var h = header.toString().trim().toLowerCase();
      
      // Standardize driver keys
      if (h === 'id_авто' || h === 'id' || h === 'водій_id' || h === 'код' || h === 'номер') {
        obj['ID_Авто'] = val;
      } else if (h === 'ім\'я' || h === 'піб' || h === 'водій' || h === 'ім’я' || h === 'фіо') {
        obj['Ім\'я'] = val;
      } else if (h === 'фото' || h === 'аватар' || h === 'зображення') {
        obj['Фото'] = val;
      } else if (h === 'telegram_id' || h === 'chat_id' || h === 'telegram' || h === 'id_телеграм') {
        obj['Telegram_ID'] = val;
      } else {
        obj[header] = val;
      }
    });
    
    // Fallbacks if some headers didn't match standard names
    if (!obj['ID_Automobile'] && obj['ID_Авто']) obj['ID_Automobile'] = obj['ID_Авто'];
    if (!obj['ID_Авто'] && obj['ID']) obj['ID_Авто'] = obj['ID'];
    if (!obj['Ім\'я'] && obj['ПІБ']) obj['Ім\'я'] = obj['ПІБ'];
    if (!obj['Ім\'я'] && obj['Водій']) obj['Ім\'я'] = obj['Водій'];
    
    // Auto-fetch Telegram Profile Photo if empty and Telegram_ID present
    if (!obj['Фото'] && obj['Telegram_ID']) {
      var base64Avatar = fetchTelegramAvatarAsBase64(obj['Telegram_ID']);
      if (base64Avatar) {
        obj['Фото'] = base64Avatar;
        // Save to spreadsheet
        var rowNum = i + 2; // +1 for header, +1 for 1-based index
        if (photoCol !== -1) {
          sheet.getRange(rowNum, photoCol + 1).setValue(base64Avatar);
        }
      }
    }
    
    return obj;
  });
}

function addDelivery(deliveryData) {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Не вдалося знайти зв'язок з Google Таблицею. Переконайтеся, що скрипт прикріплений до таблиці або вкажіть SPREADSHEET_ID в Code.gs.");
  }
  var sheet = ss.getSheetByName('Заміри');
  var id = sheet.getLastRow() > 1 ? sheet.getLastRow() : 1; // if empty, start from 1
  
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  if (headers.length === 1 && headers[0] === "") {
    sheet.appendRow(['ID', 'ID_Авто', 'Дата', 'Час', 'Адреса', 'Номер_замовлення', 'Статус_оплати', 'Статус', 'Коментар', 'Ім\'я_одержувача', 'Телефон_одержувача', 'ID_Менеджера', 'ID_Комірника', 'Статус_збору', 'Тривалість', 'Тип_виробу']);
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  } else {
    // Add missing columns if they don't exist
    var hasWorker = headers.indexOf('ID_Комірника') !== -1;
    var hasGatherStatus = headers.indexOf('Статус_збору') !== -1;
    var hasDur = headers.indexOf('Тривалість') !== -1;
    var hasProd = headers.indexOf('Тип_виробу') !== -1;
    
    if (!hasWorker) {
      sheet.getRange(1, headers.length + 1).setValue('ID_Комірника');
      headers.push('ID_Комірника');
    }
    if (!hasGatherStatus) {
      sheet.getRange(1, headers.length + 1).setValue('Статус_збору');
      headers.push('Статус_збору');
    }
    if (!hasDur) {
      sheet.getRange(1, headers.length + 1).setValue('Тривалість');
      headers.push('Тривалість');
    }
    if (!hasProd) {
      sheet.getRange(1, headers.length + 1).setValue('Тип_виробу');
      headers.push('Тип_виробу');
    }
  }
  
  var newRow = new Array(headers.length).fill('');
  
  var setVal = function(colName, val) {
    var idx = headers.indexOf(colName);
    if (idx !== -1) newRow[idx] = val;
  };

  setVal('ID', id);
  setVal('ID_Авто', deliveryData.driver_id);
  setVal('Дата', deliveryData.date);
  setVal('Час', deliveryData.time);
  setVal('Адреса', deliveryData.address);
  setVal('Номер_замовлення', deliveryData.order_num || '');
  setVal('Статус_оплати', deliveryData.payment || '');
  setVal('Статус', 'Заплановано');
  setVal('Коментар', deliveryData.comment || '');
  setVal('Ім\'я_одержувача', deliveryData.receiver_name || '');
  setVal('Телефон_одержувача', deliveryData.receiver_phone || '');
  setVal('ID_Менеджера', deliveryData.manager_chat_id || '');
  setVal('Тривалість', deliveryData['Тривалість'] || 1);
  setVal('Тип_виробу', deliveryData['product_type'] || '');
  setVal('ID_Комірника', '');
  var statusColFound = false;
  for (var k = 0; k < headers.length; k++) {
    var hStr = headers[k].toString().trim().toLowerCase();
    if (hStr === 'статус_збору' || hStr === 'статус збору' || hStr === 'статус_склад' || hStr === 'статус склад') {
      newRow[k] = 'Очікує';
      statusColFound = true;
      break;
    }
  }
  
  if (!statusColFound) {
    // Column missing! Add it!
    sheet.getRange(1, headers.length + 1).setValue('Статус_збору');
    headers.push('Статус_збору');
    newRow.push('Очікує');
  }

  sheet.appendRow(newRow);
  
  // Notify Head Warehouse Workers
  var whData = getWarehouseWorkers();
  var heads = whData.heads;
  var workers = whData.workers;
  
  if (heads.length > 0) {
    var text = "📦 <b>Нове замовлення створено!</b>\n" +
               "Замовлення №" + (deliveryData.order_num || "Б/Н") + "\n" +
               "📅 " + deliveryData.date + " " + deliveryData.time + "\n" +
               "Кому: " + (deliveryData.receiver_name || "Не вказано") + "\n\n" +
               "Будь ласка, призначте комірника на збірку:";
               
    var kb = { "inline_keyboard": [] };
    
    var shortId = String(id).replace(/-/g, '');
    
    // Add Head workers as assignees
    heads.forEach(function(h) {
      kb.inline_keyboard.push([{"text": "🧑‍💼 На себе (" + h.name + ")", "callback_data": "awh_" + shortId + "_" + h.telegram_id}]);
    });
    
    // Always add a generic option to assign to a worker
    kb.inline_keyboard.push([{"text": "👷 На комірника", "callback_data": "awh_" + shortId + "_general"}]);
    
    // Add specific regular workers if any
    workers.forEach(function(w) {
      kb.inline_keyboard.push([{"text": "👷 Призначити: " + w.name, "callback_data": "awh_" + shortId + "_" + w.telegram_id}]);
    });
    
    heads.forEach(function(head) {
      sendTelegramMessage(head.telegram_id, text, kb);
    });
  }
  
  return { status: 'success', id: id };
}

function updateDeliveryStatus(deliveryId, newStatus, comment) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error', message: 'Відсутній зв’язок із таблицею' };
  var sheet = ss.getSheetByName('Заміри');
  if (!sheet) return { status: 'error', message: 'Лист Доставки не знайдено' };
  
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('ID');
  if (idCol === -1) idCol = headers.indexOf('Код');
  var statusCol = headers.indexOf('Статус');
  var managerCol = headers.indexOf('ID_Менеджера');
  var orderCol = headers.indexOf('Номер_замовлення');
  var addressCol = headers.indexOf('Адреса');
  var carCol = headers.indexOf('ID_Авто');
  var commentCol = headers.indexOf('Коментар');
  
  if (idCol === -1 || statusCol === -1) {
    return { status: 'error', message: 'Не знайдено колонку ID (індекс: ' + idCol + ') або Статус (індекс: ' + statusCol + ') в таблиці "Доставки"' };
  }
  
  for (var i = 1; i < data.length; i++) {
    var currentIdRaw = data[i][idCol];
    if (!currentIdRaw || currentIdRaw === 'undefined') currentIdRaw = String(i + 1);
    var currentId = String(currentIdRaw).replace(/-/g, '');
    var searchId = String(deliveryId).replace(/-/g, '');
    if (currentId === searchId) {
      var rowNum = i + 1;
      
      // Update status
      sheet.getRange(rowNum, statusCol + 1).setValue(newStatus);
      
      // Update comment if provided
      if (comment && commentCol !== -1) {
        sheet.getRange(rowNum, commentCol + 1).setValue(comment);
      }
      
      // Fetch manager and order details
      var managerId = managerCol !== -1 ? data[i][managerCol] : '';
      var orderNum = orderCol !== -1 ? data[i][orderCol] : '';
      var address = addressCol !== -1 ? data[i][addressCol] : '';
      var carId = carCol !== -1 ? data[i][carCol] : '';
      
      // Send Telegram Notification to the Manager
      if (managerId) {
        var messageText = "";
        
        if (newStatus === "Виконано") {
          messageText = "🟢 <b>Доставка виконана успішно!</b>\n\n" +
                        "📦 <b>Замовлення №:</b> " + orderNum + "\n" +
                        "🚗 <b>Автомобіль:</b> Авто " + carId + "\n" +
                        "📍 <b>Адреса:</b> " + address + "\n\n" +
                        "👍 Клієнт отримав товар, замовлення закрито водієм.";
        } else if (newStatus === "Проблема") {
          messageText = "🚨 <b>УВАГА: Проблема з доставкою!</b>\n\n" +
                        "📦 <b>Замовлення №:</b> " + orderNum + "\n" +
                        "🚗 <b>Автомобіль:</b> Авто " + carId + "\n" +
                        "📍 <b>Адреса:</b> " + address + "\n\n" +
                        "⚠️ <b>Опис проблеми:</b> " + (comment || "Не вказано водієм") + "\n\n" +
                        "📞 Будь ласка, зв'яжіться з водієм або клієнтом для розв'язання ситуації.";
        } else if (newStatus === "В процесі") {
          messageText = "🚕 <b>Доставка вже в дорозі!</b>\n\n" +
                        "📦 <b>Замовлення №:</b> " + orderNum + "\n" +
                        "🚗 <b>Автомобіль:</b> Авто " + carId + "\n" +
                        "📍 <b>Адреса:</b> " + address + "\n\n" +
                        "Водій завантажився і виїхав за адресою.";
        }
        
        if (messageText) {
          sendTelegramMessage(managerId, messageText);
        }
      }
      
      var payCol = headers.indexOf('Статус_оплати');
      var nameCol = headers.indexOf("Ім'я_одержувача");
      var phoneCol = headers.indexOf('Телефон_одержувача');
      var dateCol = headers.indexOf('Дата');
      var timeCol = headers.indexOf('Час');
      
      var deliveryObj = {
        id: deliveryId,
        car_id: carId,
        date: dateCol !== -1 ? data[i][dateCol] : '',
        time: timeCol !== -1 ? data[i][timeCol] : '',
        address: address,
        order_num: orderNum,
        payment: payCol !== -1 ? data[i][payCol] : '',
        receiver_name: nameCol !== -1 ? data[i][nameCol] : '',
        receiver_phone: phoneCol !== -1 ? data[i][phoneCol] : '',
        manager_chat_id: managerId
      };
      
      return { status: 'success', id: deliveryId, delivery: deliveryObj };
    }
  }
  
  return { status: 'error', message: 'Замовлення з ID "' + deliveryId + '" не знайдено серед ' + (data.length - 1) + ' рядків.' };
}

function assignWarehouseWorker(deliveryId, workerId) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error', message: 'Відсутній зв’язок із таблицею' };
  var sheet = ss.getSheetByName('Заміри');
  if (!sheet) return { status: 'error', message: 'Лист Доставки не знайдено' };
  
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('ID');
  if (idCol === -1) idCol = headers.indexOf('Код');
  var workerCol = headers.indexOf('ID_Комірника');
  var gatherCol = headers.indexOf('Статус_збору');
  var orderCol = headers.indexOf('Номер_замовлення');
  
  if (idCol === -1) return { status: 'error', message: 'Колонку ID не знайдено' };
  
  // Якщо немає колонок комірників, додамо їх
  if (workerCol === -1) {
    sheet.getRange(1, headers.length + 1).setValue('ID_Комірника');
    workerCol = headers.length;
    headers.push('ID_Комірника');
  }
  if (gatherCol === -1) {
    sheet.getRange(1, headers.length + 1).setValue('Статус_збору');
    gatherCol = headers.length;
    headers.push('Статус_збору');
  }
  
  var orderNum = "Б/Н";
  
  for (var i = 1; i < data.length; i++) {
    var currentIdRaw = data[i][idCol];
    if (!currentIdRaw || currentIdRaw === 'undefined') currentIdRaw = String(i + 1);
    var currentId = String(currentIdRaw).replace(/-/g, '');
    var searchId = String(deliveryId).replace(/-/g, '');
    if (currentId === searchId) {
      sheet.getRange(i + 1, workerCol + 1).setValue(workerId);
      sheet.getRange(i + 1, gatherCol + 1).setValue('В процесі збору');
      if (orderCol !== -1) orderNum = data[i][orderCol];
      
      // Get the worker telegram ID to send them a notification
      var whData = getWarehouseWorkers();
      var assignedWorker = null;
      for (var j = 0; j < whData.heads.length; j++) { if (String(whData.heads[j].id) == String(workerId) || String(whData.heads[j].telegram_id) == String(workerId)) assignedWorker = whData.heads[j]; }
      for (var k = 0; k < whData.workers.length; k++) { if (String(whData.workers[k].id) == String(workerId) || String(whData.workers[k].telegram_id) == String(workerId)) assignedWorker = whData.workers[k]; }
      
      if (assignedWorker && assignedWorker.telegram_id) {
        var text = "📦 <b>Вам призначено збірку замовлення №" + orderNum + "</b>\n\n" +
                   "Натисніть 'Підтвердити', коли воно буде готове, або 'Проблема', якщо щось пішло не так.";
        var kb = {
          "inline_keyboard": [
            [{"text": "✅ Підтвердити (Зібрано)", "callback_data": "wh_confirm_" + deliveryId}],
            [{"text": "⚠️ Проблема зі збіркою", "callback_data": "wh_problem_" + deliveryId}]
          ]
        };
        var tgResp = sendTelegramMessage(assignedWorker.telegram_id, text, kb);
        return { status: 'success', tgResp: tgResp };
      } else if (workerId === 'general') {
        return { status: 'success', tgResp: 'ok' };
      } else {
        return { status: 'success', tgResp: 'No assignedWorker or telegram_id found. WorkerId was: ' + workerId };
      }
    }
  }
  return { status: 'error', message: 'Замовлення не знайдено' };
}

function updateWarehouseStatus(deliveryId, statusStr) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error' };
  var sheet = ss.getSheetByName('Заміри');
  if (!sheet) return { status: 'error' };
  
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('ID');
  if (idCol === -1) idCol = headers.indexOf('Код');
  var gatherCol = headers.indexOf('Статус_збору');
  if (gatherCol === -1) gatherCol = headers.indexOf('Статус_Склад');
  var orderCol = headers.indexOf('Номер_замовлення');
  var workerCol = headers.indexOf('ID_Комірника');
  var carCol = headers.indexOf('ID_Авто');
  
  if (idCol === -1 || gatherCol === -1) return { status: 'error' };
  
  for (var i = 1; i < data.length; i++) {
    var currentIdRaw = data[i][idCol];
    if (!currentIdRaw || currentIdRaw === 'undefined') currentIdRaw = String(i + 1);
    var currentId = String(currentIdRaw).replace(/-/g, '');
    var searchId = String(deliveryId).replace(/-/g, '');
    if (currentId === searchId) {
      sheet.getRange(i + 1, gatherCol + 1).setValue(statusStr);
      var orderNum = orderCol !== -1 ? data[i][orderCol] : "Б/Н";
      var workerId = workerCol !== -1 ? data[i][workerCol] : "";
      var carId = carCol !== -1 ? String(data[i][carCol]).trim() : "";
      var managerCol = headers.indexOf('ID_Менеджера');
      var managerId = managerCol !== -1 ? String(data[i][managerCol]).trim() : "";
      
      // If it's a problem or refusal, notify Heads and Manager
      if (statusStr.indexOf('Проблема') === 0 || statusStr.indexOf('Відмова') === 0) {
        var whData = getWarehouseWorkers();
        var workerName = "Комірник";
        
        var assignedWorker = null;
        for (var j = 0; j < whData.heads.length; j++) { if (whData.heads[j].id == workerId) assignedWorker = whData.heads[j]; }
        for (var k = 0; k < whData.workers.length; k++) { if (whData.workers[k].id == workerId) assignedWorker = whData.workers[k]; }
        
        if (assignedWorker) workerName = assignedWorker.name;
        
        var isRefusal = statusStr.indexOf('Відмова') === 0;
        var problemReason = statusStr.replace(isRefusal ? 'Відмова' : 'Проблема', '').trim();
        if (problemReason.indexOf(':') === 0) problemReason = problemReason.substring(1).trim();
        var reasonText = problemReason ? ("\n❌ Причина: " + problemReason) : "";
        
        var alertText = isRefusal 
          ? "🚨 <b>УВАГА: Клієнт не забрав замовлення (Самовивіз)!</b>\n\n"
          : "🚨 <b>УВАГА: Проблема зі збіркою!</b>\n\n";
          
        alertText += "📦 Замовлення №" + orderNum + "\n" +
                     "🧑‍🔧 Комірник: " + workerName + " повідомив про проблему." +
                     reasonText + "\n\n" +
                     "Будь ласка, розберіться в ситуації.";
                        
        whData.heads.forEach(function(h) {
          sendTelegramMessage(h.telegram_id, alertText);
        });
        
        if (managerId) {
          sendTelegramMessage(managerId, alertText);
        }
      }
      return { status: 'success', order_num: orderNum, car_id: carId };
    }
  }
  return { status: 'error' };
}

function getWarehouseWorkers() {
  var ss = getSpreadsheet();
  if (!ss) return { heads: [], workers: [] };
  
  var sheet = ss.getSheetByName('Користувачі');
  if (!sheet) return { heads: [], workers: [] };
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { heads: [], workers: [] };
  
  var headers = data[0];
  var roleIdx = headers.indexOf('Роль');
  var nameIdx = headers.indexOf('Ім\'я') !== -1 ? headers.indexOf('Ім\'я') : headers.indexOf('ПІБ');
  var tgIdx = headers.indexOf('Telegram_ID') !== -1 ? headers.indexOf('Telegram_ID') : headers.indexOf('Telegram');
  var idIdx = headers.indexOf('ID') !== -1 ? headers.indexOf('ID') : headers.indexOf('Логін');
  
  if (roleIdx === -1 || tgIdx === -1) return { heads: [], workers: [] };
  
  var heads = [];
  var workers = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var r = (row[roleIdx] || '').toString().toLowerCase().replace(/_/g, ' ');
    var tgid = (row[tgIdx] || '').toString().trim();
    var name = nameIdx !== -1 ? row[nameIdx] : ('Користувач ' + i);
    var uId = (idIdx !== -1 && row[idIdx]) ? row[idIdx] : tgid;
    
    if (!tgid) continue;
    
    if (r.includes('головний комірник') || r === 'головний_комірник') {
      heads.push({ telegram_id: tgid, name: name, id: uId });
    } else if (r === 'комірник') {
      workers.push({ telegram_id: tgid, name: name, id: uId });
    }
  }
  
  // Deduplicate by telegram_id for heads and workers separately
  var uniqueHeads = [];
  var uniqueWorkers = [];
  var hMap = {};
  var wMap = {};
  
  heads.forEach(function(h) {
    if (!hMap[h.telegram_id]) {
      hMap[h.telegram_id] = true;
      uniqueHeads.push(h);
    }
  });
  
  workers.forEach(function(w) {
    // Only add to workers if they are NOT a head
    if (!wMap[w.telegram_id] && !hMap[w.telegram_id]) {
      wMap[w.telegram_id] = true;
      uniqueWorkers.push(w);
    }
  });
  
  return { heads: uniqueHeads, workers: uniqueWorkers };
}

function authenticateUser(login, password) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error', message: 'Не вдалося підключитися до таблиці' };
  var sheet = ss.getSheetByName('Користувачі');
  if (!sheet) {
    sheet = ss.insertSheet('Користувачі');
    sheet.appendRow(['Логін', 'Пароль', 'Роль', 'Ім\'я', 'Telegram_ID']);
    sheet.appendRow(['admin', 'admin123', 'admin', 'Головний адміністратор', '1931242904']);
    sheet.appendRow(['logist1', 'logist123', 'logist', 'Диспетчер-Логіст', '1931242904']);
    sheet.appendRow(['director1', 'director123', 'director', 'Керівник підприємства', '1931242904']);
    sheet.appendRow(['manager1', 'manager123', 'manager', 'Менеджер з продажів 1', '1931242904']);
    sheet.appendRow(['manager2', 'manager222', 'manager', 'Менеджер з продажів 2', '1931242904']);
  }
  
  var range = sheet.getDataRange();
  var data = range.getValues();
  var headers = data[0];
  
  var loginCol = headers.indexOf('Логін');
  var passCol = headers.indexOf('Пароль');
  var roleCol = headers.indexOf('Роль');
  var nameCol = headers.indexOf('Ім\'я');
  var telCol = headers.indexOf('Telegram_ID');
  
  if (loginCol === -1 || passCol === -1 || roleCol === -1) {
    return { status: 'error', message: 'Некоректний формат листа користувачів' };
  }
  
  for (var i = 1; i < data.length; i++) {
    var rowLogin = String(data[i][loginCol]).trim();
    var rowPass = String(data[i][passCol]).trim();
    if (rowLogin === login && rowPass === password) {
      return {
        status: 'success',
        user: {
          login: rowLogin,
          role: String(data[i][roleCol]).trim(),
          name: nameCol !== -1 ? String(data[i][nameCol]).trim() : rowLogin,
          telegramId: telCol !== -1 ? String(data[i][telCol]).trim() : ''
        }
      };
    }
  }
  
  return { status: 'error', message: 'Невірний логін або пароль' };
}

function updateDeliveryDetails(deliveryId, deliveryData, userRole) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error', message: 'Відсутній зв’язок із таблицею' };
  var sheet = ss.getSheetByName('Заміри');
  if (!sheet) return { status: 'error', message: 'Лист Доставки не знайдено' };
  
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('ID');
  var carCol = headers.indexOf('ID_Авто');
  var dateCol = headers.indexOf('Дата');
  var timeCol = headers.indexOf('Час');
  var addressCol = headers.indexOf('Адреса');
  var orderCol = headers.indexOf('Номер_замовлення');
  var payCol = headers.indexOf('Статус_оплати');
  var commentCol = headers.indexOf('Коментар');
  var nameCol = headers.indexOf('Ім\'я_одержувача');
  var phoneCol = headers.indexOf('Телефон_одержувача');
  var managerCol = headers.indexOf('ID_Менеджера');
  var durCol = headers.indexOf('Тривалість');
  var prodCol = headers.indexOf('Тип_виробу');
  
  if (idCol === -1) {
    return { status: 'error', message: 'Необхідні заголовки таблиці відсутні' };
  }
  
  for (var i = 1; i < data.length; i++) {
    var currentIdRaw = data[i][idCol];
    if (!currentIdRaw || currentIdRaw === 'undefined') currentIdRaw = String(i + 1);
    
    var matchId = idCol !== -1 && String(currentIdRaw).trim() === String(deliveryId).trim();
    var matchOrder = orderCol !== -1 && String(data[i][orderCol]).trim() === String(deliveryId).trim();
    var matchFallback = idCol !== -1 && String(currentIdRaw).trim() === String(deliveryData.order_num).trim();
    var matchOrderFallback = orderCol !== -1 && String(data[i][orderCol]).trim() === String(deliveryData.order_num).trim();
    
    if (matchId || matchOrder || matchFallback || matchOrderFallback) {
      var rowNum = i + 1;
      
      // Store old values for comparison
      var oldCar = carCol !== -1 ? data[i][carCol] : '';
      var oldDate = dateCol !== -1 ? data[i][dateCol] : '';
      var oldTime = timeCol !== -1 ? data[i][timeCol] : '';
      var oldAddress = addressCol !== -1 ? data[i][addressCol] : '';
      var oldOrderNum = orderCol !== -1 ? data[i][orderCol] : '';
      var managerId = managerCol !== -1 ? data[i][managerCol] : '';
      
      // Update spreadsheet cells
      if (carCol !== -1) sheet.getRange(rowNum, carCol + 1).setValue(deliveryData.car !== undefined ? deliveryData.car : (deliveryData.driver_id || ''));
      if (dateCol !== -1) sheet.getRange(rowNum, dateCol + 1).setValue(deliveryData.date || '');
      if (timeCol !== -1) sheet.getRange(rowNum, timeCol + 1).setValue(deliveryData.time || '');
      if (addressCol !== -1) sheet.getRange(rowNum, addressCol + 1).setValue(deliveryData.address || '');
      if (orderCol !== -1) sheet.getRange(rowNum, orderCol + 1).setValue(deliveryData.order_num || '');
      if (payCol !== -1) sheet.getRange(rowNum, payCol + 1).setValue(deliveryData.payment || '');
      if (commentCol !== -1) sheet.getRange(rowNum, commentCol + 1).setValue(deliveryData.comment || '');
      if (nameCol !== -1) sheet.getRange(rowNum, nameCol + 1).setValue(deliveryData.receiver_name || '');
      if (phoneCol !== -1) sheet.getRange(rowNum, phoneCol + 1).setValue(deliveryData.receiver_phone || '');
      if (durCol !== -1) sheet.getRange(rowNum, durCol + 1).setValue(deliveryData.duration || deliveryData['Тривалість'] || 1);
      if (prodCol !== -1) sheet.getRange(rowNum, prodCol + 1).setValue(deliveryData.product_type || '');
      
      // Check if changes are made by logist/director/admin and notify manager if critical fields shifted
      if (managerId && (userRole === 'logist' || userRole === 'director' || userRole === 'admin')) {
        var changed = false;
        var diffText = "";
        
        if (oldDate !== deliveryData.date) {
          diffText += "📅 <b>Дата:</b> " + oldDate + " ➡️ <b>" + deliveryData.date + "</b>\n";
          changed = true;
        }
        if (oldTime !== deliveryData.time) {
          diffText += "🕒 <b>Час:</b> " + oldTime + " ➡️ <b>" + deliveryData.time + "</b>\n";
          changed = true;
        }
        if (oldCar !== deliveryData.driver_id) {
          diffText += "🚗 <b>Автомобіль:</b> Авто " + oldCar + " ➡️ <b>Авто " + deliveryData.driver_id + "</b>\n";
          changed = true;
        }
        if (oldAddress !== deliveryData.address) {
          diffText += "📍 <b>Адреса:</b> " + oldAddress + " ➡️ <b>" + deliveryData.address + "</b>\n";
          changed = true;
        }
        
        if (changed) {
          var notificationText = "🔄 <b>Коригування доставки логістом!</b>\n\n" +
                                 "📦 <b>Замовлення №:</b> " + (deliveryData.order_num || oldOrderNum) + "\n\n" +
                                 "Логіст оновив параметри вашої доставки:\n" + diffText + "\n" +
                                 "ℹ️ Будь ласка, врахуйте ці зміни у вашій роботі.";
          sendTelegramMessage(managerId, notificationText);
        }
      }
      
      return { status: 'success', id: deliveryId };
    }
  }
  return { status: 'error', message: 'Замовлення не знайдено' };
}

function fetchTelegramAvatarAsBase64(telegramId) {
  if (!BOT_TOKEN || !telegramId) return "";
  try {
    var getPhotosUrl = "https://api.telegram.org/bot" + BOT_TOKEN + "/getUserProfilePhotos?user_id=" + telegramId + "&limit=1";
    var response = UrlFetchApp.fetch(getPhotosUrl, { muteHttpExceptions: true });
    var resData = JSON.parse(response.getContentText());
    if (resData.ok && resData.result && resData.result.photos && resData.result.photos.length > 0) {
      var photoArray = resData.result.photos[0];
      // Get the smallest photo size
      var fileId = photoArray[0].file_id;
      
      // Get file path
      var getFileUrl = "https://api.telegram.org/bot" + BOT_TOKEN + "/getFile?file_id=" + fileId;
      var fileResponse = UrlFetchApp.fetch(getFileUrl, { muteHttpExceptions: true });
      var fileData = JSON.parse(fileResponse.getContentText());
      if (fileData.ok && fileData.result && fileData.result.file_path) {
        var filePath = fileData.result.file_path;
        var downloadUrl = "https://api.telegram.org/file/bot" + BOT_TOKEN + "/" + filePath;
        
        // Fetch image bytes
        var imgResponse = UrlFetchApp.fetch(downloadUrl, { muteHttpExceptions: true });
        if (imgResponse.getResponseCode() === 200) {
          var blob = imgResponse.getBlob();
          var base64Data = Utilities.base64Encode(blob.getBytes());
          var contentType = blob.getContentType() || "image/jpeg";
          return "data:" + contentType + ";base64," + base64Data;
        }
      }
    }
  } catch (e) {
    Logger.log("Помилка отримання аватара Telegram: " + e.toString());
  }
  return "";
}

function updateDriverPhoto(carId, photoBase64) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error', message: 'Відсутній зв’язок із таблицею' };
  var sheet = ss.getSheetByName('Екіпажі') || ss.getSheetByName('Водії');
  if (!sheet) return { status: 'error', message: 'Лист Екіпажі/Водії не знайдено' };
  
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  var headers = data[0];
  
  var carCol = -1;
  var photoCol = -1;
  
  headers.forEach(function(header, idx) {
    var h = header.toString().trim().toLowerCase();
    if (h === 'id_авто' || h === 'id' || h === 'водій_id' || h === 'код' || h === 'номер') {
      carCol = idx;
    } else if (h === 'фото' || h === 'аватар' || h === 'зображення') {
      photoCol = idx;
    }
  });
  
  if (carCol === -1 || photoCol === -1) {
    return { status: 'error', message: 'Необхідні заголовки відсутні в листі Водії' };
  }
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][carCol] == carId) {
      var rowNum = i + 1;
      sheet.getRange(rowNum, photoCol + 1).setValue(photoBase64);
      return { status: 'success', carId: carId };
    }
  }
  return { status: 'error', message: 'Водія з вказаним ID Авто не знайдено' };
}

function saveDailyCrew(dateStr, carId, telegramId, name) {
  var ss = getSpreadsheet();
  if (!ss) return { status: 'error', message: 'Відсутній зв’язок із таблицею' };
  
  var sheet = ss.getSheetByName('Чергування');
  if (!sheet) {
    sheet = ss.insertSheet('Чергування');
    sheet.appendRow(['Дата', 'ID_Авто', 'Telegram_ID', 'Ім\'я', 'Фото']);
  }
  
  var range = sheet.getDataRange();
  var data = range.getDisplayValues();
  
  var rowNum = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === dateStr && data[i][1] == carId) {
      rowNum = i + 1;
      break;
    }
  }
  
  // Fetch Telegram avatar Base64
  var base64Avatar = fetchTelegramAvatarAsBase64(telegramId);
  
  // Try to get it from default drivers if empty
  if (!base64Avatar) {
    var defaultDrivers = getDrivers();
    var match = defaultDrivers.find(function(d) { return d['Telegram_ID'] == telegramId; });
    if (match && match['Фото']) {
      base64Avatar = match['Фото'];
    }
  }
  
  if (rowNum !== -1) {
    sheet.getRange(rowNum, 3).setValue(telegramId);
    sheet.getRange(rowNum, 4).setValue(name);
    if (base64Avatar) {
      sheet.getRange(rowNum, 5).setValue(base64Avatar);
    }
  } else {
    sheet.appendRow([dateStr, carId, telegramId, name, base64Avatar || ""]);
  }
  
  return { status: 'success', date: dateStr, carId: carId };
}

function getDailyCrews() {
  var ss = getSpreadsheet();
  if (!ss) return [];
  var sheet = ss.getSheetByName('Чергування');
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row, rowIndex) {
    var obj = {};
    headers.forEach(function(header, index) {
      var val = row[index];
      var h = header.toString().trim().toLowerCase();
      
      if (h === 'дата') {
        obj['Дата'] = val;
      } else if (h === 'id_авто' || h === 'id_автомобіля' || h === 'автомобіль') {
        obj['ID_Авто'] = val;
      } else if (h === 'telegram_id' || h === 'chat_id') {
        obj['Telegram_ID'] = val;
      } else if (h === 'ім\'я' || h === 'піб') {
        obj['Ім\'я'] = val;
      } else if (h === 'фото' || h === 'аватар') {
        obj['Фото'] = val;
      } else {
        obj[header] = val;
      }
    });
    return obj;
  });
}

// ====== АВТОМАТИЧНІ РОЗСИЛКИ ======

function setupNotifications() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var handlerName = triggers[i].getHandlerFunction();
    if (handlerName === 'sendCarSelectionReminders' || handlerName === 'sendTodayRoutes' || handlerName === 'sendTomorrowRoutes') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger('sendCarSelectionReminders')
           .timeBased()
           .everyDays(1)
           .atHour(11)
           .nearMinute(0)
           .create();
           
  ScriptApp.newTrigger('sendTodayRoutes')
           .timeBased()
           .everyDays(1)
           .atHour(11)
           .nearMinute(30)
           .create();
           
  Logger.log('Тригери успішно встановлено!');
}

function sendCarSelectionReminders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Користувачі');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var roleIdx = headers.indexOf('Роль');
  var tgIdx = headers.indexOf('Telegram_ID');
  
  if (roleIdx === -1 || tgIdx === -1) return;
  
  for (var i = 1; i < data.length; i++) {
    var role = data[i][roleIdx];
    var tgId = data[i][tgIdx];
    if (role === 'driver' && tgId) {
      var msg = 'Привіт! 🚗 Нагадую, що тобі потрібно обрати авто на завтра.\n\nБудь ласка, перейди у додаток та зроби свій вибір.';
      try {
        sendTelegramMessage(tgId, msg);
      } catch (e) {}
    }
  }
}

function sendTodayRoutes() {
  var today = new Date();
  var todayStr = Utilities.formatDate(today, 'Europe/Kiev', 'yyyy-MM-dd');
  
  var deliveries = getDeliveries().filter(function(d) { return d['Дата'] === todayStr; });
  var dailyCrews = getDailyCrews().filter(function(c) { return c['Дата'] === todayStr; });
  
  var carDeliveries = {};
  deliveries.forEach(function(d) {
    if (!carDeliveries[d['ID_Авто']]) carDeliveries[d['ID_Авто']] = [];
    carDeliveries[d['ID_Авто']].push(d);
  });
  
  dailyCrews.forEach(function(crew) {
    var workerName = "Невідомий комірник";
    var workerTgId = "";
    
    if (workerId === 'general') {
      workerName = 'Комірник';
    } else if (usersSheet) {
      var data = usersSheet.getDataRange().getValues();
      var headers = data[0];
      var tgCol = headers.indexOf('Telegram_ID');
      var nameCol = headers.indexOf('ПІБ');
      var idCol = headers.indexOf('ID');
      
      if (tgCol !== -1) {
        for (var i = 1; i < data.length; i++) {
          var uId = (idCol !== -1 && data[i][idCol]) ? data[i][idCol] : data[i][tgCol];
          if (String(uId) === String(workerId) || String(data[i][tgCol]) === String(workerId)) {
            workerName = nameCol !== -1 ? data[i][nameCol] : ('Комірник ' + workerId);
            workerTgId = data[i][tgCol];
            break;
          }
        }
      }
    }  var tgId = crew['Telegram_ID'];
    var carId = crew['ID_Авто'];
    if (!tgId || !carId) return;
    
    var routeMsg = '🗺 Твій маршрут на сьогодні (' + todayStr + ') для Авто ' + carId + ':\n\n';
    var dels = carDeliveries[carId] || [];
    
    if (dels.length === 0) {
      routeMsg += 'На сьогодні доставок поки немає. Відпочивай! 😎';
    } else {
      dels.sort(function(a, b) { return a['Час'].localeCompare(b['Час']); });
      dels.forEach(function(d, index) {
        var comp = d['Ім\'я_одержувача'] ? d['Ім\'я_одержувача'] : '';
        routeMsg += (index + 1) + '. ⏰ ' + d['Час'] + '\n';
        if (comp) routeMsg += '🏢 ' + comp + '\n';
        routeMsg += '📍 ' + d['Адреса'] + '\n';
        routeMsg += '📦 №' + d['Номер_замовлення'] + ' (' + (d['Статус_оплати'] || 'Невідомо') + ')\n';
        if (d['Коментар']) routeMsg += '💬 ' + d['Коментар'] + '\n';
        routeMsg += '\n';
      });
    }
    
    try {
      sendTelegramMessage(tgId, routeMsg);
    } catch (e) {}
  });
}

// ==========================================
// CLIENTS & EMPLOYEES
// ==========================================

function get_clients() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Клієнти');
  if (!sheet) {
    sheet = ss.insertSheet('Клієнти');
    sheet.appendRow(['ID', 'Тип', 'Назва', 'Контакт', 'Телефон', 'Email', 'Telegram', 'Viber', 'WhatsApp', 'Примітки']);
    return { status: 'success', data: [] };
  }
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };
  
  var headers = data[0];
  var rows = data.slice(1);
  
  var idIndex = -1;
  for (var k = 0; k < headers.length; k++) {
    var key = headers[k].toString().trim();
    if (key.toUpperCase() === 'ID' || key.toLowerCase() === 'ід') {
      idIndex = k;
      break;
    }
  }

  var result = rows.map(function(row, rowIndex) {
    var obj = {};
    headers.forEach(function(header, index) { 
      var key = header.toString().trim();
      if (key.toUpperCase() === 'ID' || key.toLowerCase() === 'ід') key = 'ID';
      obj[key] = row[index]; 
    });
    
    // Auto-assign ID if missing and row has actual data
    var hasData = Object.keys(obj).some(function(k) { return k !== 'ID' && obj[k] !== ''; });
    if (!obj['ID'] && idIndex > -1 && hasData) {
      obj['ID'] = 'CLI-' + new Date().getTime() + '-' + rowIndex;
      sheet.getRange(rowIndex + 2, idIndex + 1).setValue(obj['ID']);
    }
    
    return obj;
  }).filter(function(row) { return row['ID']; }); // only with ID
  
  return { status: 'success', data: result };
}

function saveClient(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Клієнти');
  if (!sheet) {
    sheet = ss.insertSheet('Клієнти');
    sheet.appendRow(['ID', 'Тип', 'Назва', 'Контакт', 'Телефон', 'Email', 'Telegram', 'Viber', 'WhatsApp', 'Примітки', 'Додаткові_Контакти']);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Ensure Додаткові_Контакти column exists
  if (headers.indexOf('Додаткові_Контакти') === -1) {
    headers.push('Додаткові_Контакти');
    sheet.getRange(1, headers.length).setValue('Додаткові_Контакти');
  }
  if (headers.indexOf('Логотип') === -1) {
    headers.push('Логотип');
    sheet.getRange(1, headers.length).setValue('Логотип');
  }
  var idIndex = -1;
  for (var k = 0; k < headers.length; k++) {
    var key = headers[k].toString().trim();
    if (key.toUpperCase() === 'ID' || key.toLowerCase() === 'ід') {
      idIndex = k;
      break;
    }
  }
  
  if (!payload.id) {
    payload.id = 'CLI-' + new Date().getTime();
    var newRow = headers.map(function(h) {
      var key = h.toString().trim();
      if (key.toUpperCase() === 'ID' || key.toLowerCase() === 'ід') key = 'ID';
      
      if (key === 'ID') return payload.id;
      if (key === 'Тип') return payload.type;
      if (key === 'Назва') return payload.name;
      if (key === 'Контакт') return payload.contact;
      if (key === 'Телефон') return payload.phone;
      if (key === 'Email') return payload.email;
      if (key === 'Telegram') return payload.telegram;
      if (key === 'Viber') return payload.viber;
      if (key === 'WhatsApp') return payload.whatsapp;
      if (key === 'Примітки') return payload.notes;
      if (key === 'Додаткові_Контакти') return payload.extra_contacts || '';
      if (key === 'Логотип') return payload.logo || '';
      return '';
    });
    sheet.appendRow(newRow);
  } else {
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idIndex] === payload.id) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex > -1) {
      headers.forEach(function(h, idx) {
        var key = h.toString().trim();
        if (key.toUpperCase() === 'ID' || key.toLowerCase() === 'ід') key = 'ID';
        
        var val = '';
        if (key === 'ID') val = payload.id;
        if (key === 'Тип') val = payload.type;
        if (key === 'Назва') val = payload.name;
        if (key === 'Контакт') val = payload.contact;
        if (key === 'Телефон') val = payload.phone;
        if (key === 'Email') val = payload.email;
        if (key === 'Telegram') val = payload.telegram;
        if (key === 'Viber') val = payload.viber;
        if (key === 'WhatsApp') val = payload.whatsapp;
        if (key === 'Примітки') val = payload.notes;
        if (key === 'Додаткові_Контакти') val = payload.extra_contacts || '';
        if (key === 'Логотип') val = payload.logo || '';
        
        // We allow overwriting with empty string for extra_contacts to clear them
        if (val !== '' || key === 'Додаткові_Контакти' || key === 'Логотип') {
          sheet.getRange(rowIndex, idx + 1).setValue(val);
        }
      });
    } else {
      return { status: 'error', message: 'Клієнта не знайдено для оновлення' };
    }
  }
  return { status: 'success' };
}

function deleteClient(id) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Клієнти');
  if (!sheet) return { status: 'error', message: 'Аркуш не знайдено' };
  
  var data = sheet.getDataRange().getValues();
  var idIndex = data[0].indexOf('ID');
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Клієнта не знайдено' };
}

function get_employees() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Користувачі');
  if (!sheet) return { status: 'success', data: [] };
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };
  
  var headers = data[0];
  var rows = data.slice(1);
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) { obj[header] = row[index]; });
    // Normalize role string if needed
    obj['Роль'] = (obj['Роль'] || '').toLowerCase().trim();
    // Use Login as ID if ID is missing
    if (!obj['ID']) obj['ID'] = obj['Логін'];
    return obj;
  }).filter(function(row) { return row['ID']; });
  
  return { status: 'success', data: result };
}

function saveEmployee(payload) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Користувачі');
  if (!sheet) {
    sheet = ss.insertSheet('Користувачі');
    sheet.appendRow(['Логін', 'Пароль', 'ПІБ', 'Роль', 'Авто', 'Телефон', 'Telegram']);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var loginIndex = headers.indexOf('Логін');
  
  var isNew = !payload.id;
  var login = payload.id || ('user' + new Date().getTime());
  
  if (isNew) {
    var newRow = headers.map(function(h) {
      if (h === 'Логін') return login;
      if (h === 'Пароль') return '1234'; // Default password
      if (h === 'ПІБ') return payload.name;
      if (h === 'Роль') return payload.role;
      if (h === 'Авто') return payload.car;
      if (h === 'Телефон') return payload.phone;
      if (h === 'Telegram') return payload.telegram;
      return '';
    });
    sheet.appendRow(newRow);
  } else {
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][loginIndex] === payload.id) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex > -1) {
      headers.forEach(function(h, idx) {
        // don't overwrite password
        if (h === 'Пароль') return; 
        var val = '';
        if (h === 'Логін') val = payload.id;
        if (h === 'ПІБ') val = payload.name;
        if (h === 'Роль') val = payload.role;
        if (h === 'Авто') val = payload.car;
        if (h === 'Телефон') val = payload.phone;
        if (h === 'Telegram') val = payload.telegram;
        if (['Логін', 'ПІБ', 'Роль', 'Авто', 'Телефон', 'Telegram'].indexOf(h) !== -1) {
          sheet.getRange(rowIndex, idx + 1).setValue(val);
        }
      });
    } else {
      return { status: 'error', message: 'Співробітника не знайдено' };
    }
  }
  return { status: 'success' };
}

function deleteEmployee(id) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Користувачі');
  if (!sheet) return { status: 'error', message: 'Аркуш не знайдено' };
  
  var data = sheet.getDataRange().getValues();
  var loginIndex = data[0].indexOf('Логін');
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][loginIndex] === id) {
      sheet.deleteRow(i + 1);
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Співробітника не знайдено' };
}

function register_driver(data) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: 'error', message: 'No spreadsheet connection' };
    
    var sheet = ss.getSheetByName('Користувачі');
    if (!sheet) return { status: 'error', message: 'Sheet Користувачі not found' };
    
    var name = data.name || "Невідомий Водій";
    var telegram_id = data.telegram_id || "";
    
    // Generate unique ID and logic
    var id = Utilities.getUuid();
    var login = "driver_" + telegram_id;
    var password = "driver_" + Math.floor(1000 + Math.random() * 9000); // e.g. driver_4521
    var role = data.role || "driver";
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var newRow = new Array(headers.length).fill('');
    
    var setVal = function(colNames, val) {
      for (var i = 0; i < colNames.length; i++) {
        var idx = headers.indexOf(colNames[i]);
        if (idx !== -1) {
          newRow[idx] = val;
          return;
        }
      }
    };
    
    setVal(['Логін'], login);
    setVal(['Пароль'], password);
    setVal(['Роль'], role);
    setVal(['ПІБ', 'Ім\'я'], name);
    setVal(['Telegram', 'Telegram_ID'], telegram_id);
    setVal(['ID'], id);
    if (data.phone) setVal(['Телефон'], data.phone);
    
    sheet.appendRow(newRow);
    
    return { status: 'success', message: 'Driver registered' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}



function initSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Доставки
  var deliveries = ss.getSheetByName('Заміри');
  if (!deliveries) {
    deliveries = ss.insertSheet('Доставки');
    deliveries.appendRow([
      "ID", "Дата", "Час", "Адреса", "Номер_замовлення", "Статус_оплати", 
      "Ім'я_одержувача", "Телефон_одержувача", "Коментар", "ID_Авто", 
      "Водій", "Статус", "ID_Менеджера", "Тривалість"
    ]);
  }

  // Водії
  var drivers = ss.getSheetByName('Водії');
  if (!drivers) {
    drivers = ss.insertSheet('Водії');
    drivers.appendRow(["ID_Авто", "Автомобіль", "Авто", "Фото"]);
  }

  // Клієнти
  var clients = ss.getSheetByName('Клієнти');
  if (!clients) {
    clients = ss.insertSheet('Клієнти');
    clients.appendRow(["ID_Клієнта", "Назва", "Телефон", "Адреса"]);
  }

  // Екіпажі
  var crews = ss.getSheetByName('Екіпажі');
  if (!crews) {
    crews = ss.insertSheet('Екіпажі');
    crews.appendRow(["Дата", "Авто_1", "Авто_2", "Авто_3", "Авто_4", "Авто_5", "Авто_6", "Авто_7", "Авто_8", "Авто_9"]);
  }
}


function syncAlserData(clientTimestamp) {
  var loginUrl = "https://api.alser.ua/calendar/login.php";
  var payload = {
    'login': '473829bma',
    'password': '2GQNDmUp910N'
  };
  
  var options = {
    'method': 'post',
    'payload': payload,
    'headers': {
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    'muteHttpExceptions': true
  };
  
  var response = UrlFetchApp.fetch(loginUrl, options);
  var cookies = response.getAllHeaders()['Set-Cookie'];
  var cookieString = "";
  if (cookies) {
    if (Array.isArray(cookies)) {
      cookieString = cookies.map(function(c) { return c.split(';')[0]; }).join('; ');
    } else {
      cookieString = cookies.split(';')[0];
    }
  }
  
  var today = clientTimestamp ? new Date(clientTimestamp) : new Date();
  var dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  var dataUrl = "https://api.alser.ua/calendar/?date=" + dateStr;
  var dataOptions = {
    'method': 'get',
    'headers': {
      'Cookie': cookieString,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    'muteHttpExceptions': true
  };
  
  var dataResponse = UrlFetchApp.fetch(dataUrl, dataOptions);
  var html = dataResponse.getContentText();
  
  var added = 0;
  var updated = 0;
  
  try {
    // 1. Build dictionary of Alser users: userId -> fullname
    var userRegex = /<div[^>]*data-userId="([^"]*)"[^>]*data-fullname="([^"]*)"/g;
    var alserUsers = {};
    var userMatch;
    while ((userMatch = userRegex.exec(html)) !== null) {
      alserUsers[userMatch[1].trim()] = userMatch[2].trim();
    }
    
    // 2. Fetch our system drivers
    var ourDrivers = getDrivers();
    
    // Helper to normalize name: "Денис Юрасов" -> "дениссвистун" -> sorted "денисюрасов"
    function normalizeName(name) {
      return name.toLowerCase().replace(/[^а-яієїґa-z\s]/g, '').trim().split(/\s+/).sort().join('');
    }
    
    // 3. Create mapping from Alser userId -> our Driver ID
    var alserIdToOurDriver = {};
    for (var aId in alserUsers) {
      var aNameNorm = normalizeName(alserUsers[aId]);
      if (aNameNorm.indexOf('белонін') !== -1) continue; // Ignore Belonin
      
      for (var i = 0; i < ourDrivers.length; i++) {
        var dNameNorm = normalizeName(ourDrivers[i]['Ім\'я']);
        if (dNameNorm.indexOf('белонін') !== -1) continue;
        
        // Exact normalized match (handles flipped first/last name)
        if (aNameNorm === dNameNorm || aNameNorm.indexOf(dNameNorm) !== -1 || dNameNorm.indexOf(aNameNorm) !== -1) {
          alserIdToOurDriver[aId] = ourDrivers[i];
          break;
        }
      }
    }
    
    // 4. Fetch existing deliveries to avoid duplicates
    var existingDeliveries = getDeliveries();
    var existingDealIds = {};
    existingDeliveries.forEach(function(d) {
      if (d['ID']) existingDealIds[d['ID'].toString()] = true;
    });
    
    var scopes = html.split('<div class="scopeName">');
    var newDeliveriesToAdd = [];
    var debugMatchedEvents = 0;
    
    for (var scopeIdx = 1; scopeIdx < scopes.length; scopeIdx++) {
        var scopeHtml = scopes[scopeIdx];
        var groupMatch = scopeHtml.match(/^([^<]*)<\/div>/);
        var groupName = groupMatch ? groupMatch[1].trim() : "";
        
        var regex = /<div[^>]*taskType="([^"]*)"[^>]*responsibleID="([^"]*)"[^>]*deal_id="([^"]*)"[^>]*task_id="([^"]*)"[^>]*>([^<]*)<br>([^<]*)<br>([^<]*)<\/div>/g;
        var match;
        while ((match = regex.exec(scopeHtml)) !== null) {
       var taskType = match[1].trim();
       var responsibleID = match[2].trim();
       var dealId = match[3].trim();
       var taskId = match[4].trim();
       var timeStr = match[5].trim();
       var productStr = match[6].trim();
       
       var responsibleID = match[2].trim();
       
       // Handle multiple IDs if space-separated
       var numericResponsibleId = parseInt(responsibleID);
       if (isNaN(numericResponsibleId)) continue;
       
       var mappedDriver = alserIdToOurDriver[numericResponsibleId.toString()];
       if (!mappedDriver) continue;
       
       var dName = mappedDriver['Ім\'я'];
       var allowedGroup = null;
       if (dName === 'Денис Юрасов' || dName === 'Свистун Олена' || dName === 'Коломієць Руслан') {
           allowedGroup = 'Жалюзі';
       } else if (dName === 'Захаров Олег' || dName === 'Коржов Вячеслав' || dName === 'Мартинюк Валерій') {
           allowedGroup = 'Жалюзи Одесса';
       } else if (dName === 'Сергій Ревука') {
           allowedGroup = 'Жалюзи Хмел.';
       } else if (dName === 'Радіоненко Олена') {
           allowedGroup = 'Жалюзи Львів';
       }
       
       if (allowedGroup && groupName !== allowedGroup) {
           continue;
       }
       

       var newRow = {
         'ID': dealId,
         'Час': timeStr,
         'Автомобіль': mappedDriver['ID_Авто'],
         'Водій': mappedDriver['Ім\'я'],
         'Клієнт': "Клієнт #" + dealId + " (" + productStr + ")",
         'Адреса': "Адреса уточнюється",
         'Телефон': "",
         'Статус': "Новий",
         'Дата': dateStr,
         'Коментар': "Синхронізовано з Alser"
       };

       if (existingDealIds[dealId]) {
         // Existing delivery, let's update it in the sheet instead of skipping
         var idx = -1;
         for (var j = 0; j < existingDeliveries.length; j++) {
           if (existingDeliveries[j]['ID'] == dealId) { idx = j; break; }
         }
         if (idx !== -1) {
            // Update the existing row (offset by 2 for header and 0-index)
            var rowIndex = idx + 2; 
            var ss = getSpreadsheet();
            var sheet = ss.getSheetByName('Заміри');
            if (sheet) {
                var headers = sheet.getDataRange().getValues()[0];
                var rowToUpdate = headers.map(function(header) {
                    var h = header.toString().trim().toLowerCase();
                    if (h === 'id' || h === 'код') return newRow['ID'];
                    if (h === 'час') return newRow['Час'];
                    if (h === 'id_авто' || h === 'id_автомобіля' || h === 'автомобіль' || h === 'авто') return newRow['Автомобіль'];
                    if (h === 'водій' || h === 'id_водія' || h === 'водія' || h === 'ім\'я водія' || h === 'прізвище') return newRow['Водій'];
                    if (h === 'клієнт' || h === 'замовник' || h === 'піб клієнта') return newRow['Клієнт'];
                    if (h === 'адреса' || h === 'адреса доставки') return newRow['Адреса'];
                    if (h === 'телефон' || h === 'номер телефону') return newRow['Телефон'];
                    if (h === 'статус') return newRow['Статус'];
                    if (h === 'дата' || h === 'дата доставки') return newRow['Дата'];
                    if (h === 'коментар' || h === 'примітки') return newRow['Коментар'];
                    return '';
                });
                sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowToUpdate]);
                updated++;
            }
         }
       } else {
         existingDealIds[dealId] = true;
         newDeliveriesToAdd.push(newRow);
       }
     }
    }
    
    // 6. Save new deliveries
    if (newDeliveriesToAdd.length > 0) {
      var ss = getSpreadsheet();
      var sheet = ss.getSheetByName('Заміри');
      if (!sheet) {
         sheet = ss.insertSheet('Заміри');
         sheet.getRange(1, 1, 1, 10).setValues([['ID', 'Час', 'Автомобіль', 'Водій', 'Клієнт', 'Адреса', 'Телефон', 'Статус', 'Дата', 'Коментар']]);
      }
      if (sheet) {
        var headers = sheet.getDataRange().getValues()[0];
        if (!headers || headers.length === 0 || !headers[0]) {
           headers = ['ID', 'Час', 'Автомобіль', 'Водій', 'Клієнт', 'Адреса', 'Телефон', 'Статус', 'Дата', 'Коментар'];
           sheet.getRange(1, 1, 1, 10).setValues([headers]);
        }
        var rowsToAdd = newDeliveriesToAdd.map(function(d) {
          return headers.map(function(header) {
            var h = header.toString().trim().toLowerCase();
            if (h === 'id' || h === 'код') return d['ID'];
            if (h === 'час') return d['Час'];
            if (h === 'id_авто' || h === 'id_автомобіля' || h === 'автомобіль' || h === 'авто') return d['Автомобіль'];
            if (h === 'водій' || h === 'id_водія' || h === 'водія' || h === 'ім\'я водія' || h === 'прізвище') return d['Водій'];
            if (h === 'клієнт' || h === 'замовник' || h === 'піб клієнта') return d['Клієнт'];
            if (h === 'адреса' || h === 'адреса доставки') return d['Адреса'];
            if (h === 'телефон' || h === 'номер телефону') return d['Телефон'];
            if (h === 'статус') return d['Статус'];
            if (h === 'дата' || h === 'дата доставки') return d['Дата'];
            if (h === 'коментар' || h === 'примітки') return d['Коментар'];
            return '';
          });
        });
        
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
        added = rowsToAdd.length;
      }
    }
    
  } catch (e) {
    return { success: false, error: "Помилка: " + e.toString() };
  }
  
  
  return { 
    success: true, 
    added: added, 
    updated: updated,
    debug_alserUsers: Object.keys(alserUsers).length,
    debug_ourDrivers: ourDrivers.length,
    debug_mapped: Object.keys(alserIdToOurDriver).length,
    debug_matchedEvents: newDeliveriesToAdd.length
  };

}

function getDeliveriesCount() {
  var ss = getSpreadsheet();
  var sheets = ss.getSheets();
  var names = sheets.map(function(s) { return s.getName(); });
  return ContentService.createTextOutput(JSON.stringify(names));
}

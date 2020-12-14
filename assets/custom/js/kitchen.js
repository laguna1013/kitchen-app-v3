let cook_option = "batch"; // Batch cook or amount cook
let selected_item_id = -1;
let defaultMaterialID = localStorage.getItem('selectedMaterialId') ? localStorage.getItem('selectedMaterialId') : -1; // 默认选中的物料的id
let currentCode = -1; // 默认选中的物料的code;
// App
let init = () => {
  // Welcome message
  setTimeout(function() {
    kitchen_notification('Welcome back, admin!', 'Please start cooking.', 'assets/img/media/user.png');
  }, 1000);
  get_materials();
  setInterval(function () {
    get_materials();
    if(materials){
      materials.forEach(item => {
        if(item.cooking_items.length > 0){
          item.cooking_items.forEach(_item => {
            let currentCookingMin = get_elapsed_hr_min(_item.started_cooking_time).min + get_elapsed_hr_min(_item.started_cooking_time).hr * 60;
            if(currentCookingMin >= item.cooking_time){
              kitchen_notification(
                `${ item.name } is ready.`,
                `Please check the quality and serve.`,
                'assets/img/media/success.png',
                true,
                5000,
                true,
                'assets/alarm.mp3'
              );
            }
          })
        }
      })
    }
  }, 5 * 1000);
  // 安全库存和每天开店要煮的
  setTimeout(function () {
    $idx = materials.filter((o) => o.cooked_items.length != 0).length;
    if ($idx == 0) {
      // 如果都是空的那麽就顯示需要默認煮的數量
      let items_tag = ``
      materials.map((o) => {
        if (o["advise_dosage"] != 0) {
          items_tag += `
            <div class="d-flex">
              <span class="f-w-700">${o["name"]} - </span>
              <span class="ml-2">${o["advise_dosage"]}g</span>
            </div>
          `
        }
      });
      kitchen_notification(
        'Good Morning, Please cook these items.',
        items_tag,
        'assets/img/media/warning.png',
        true,
        3000,
        true,
        'assets/alarm.mp3'
      );
      render_notification();
    }
  }, 5000);
  // time
  setInterval(function () {
    $(".timestamp").text(moment().format("HH:mm:ss DD, MMM YYYY"));
  }, 1000);
};

// 左边material的列表的样式 和 默认刚打开页面选中第一个
let render_item_list = () => {
  // Renders item on sidebar
  //let data = get_data(); // Need to be changed
  data = [...materials];
  if (data.length == 0) {
    return;
  }
  $(".item-list").empty();
  data.forEach((item) => {
    $idx = 0;
    // 初始化bar的颜色
    item["cooked_items"].map((o) => {
      // 检查有无负库存
      o["barColor"] = "green";
    });

    item["cooked_items"].map((o) => {
      if (o["remaining_amount"] * 1 < 0) {
        // 检查有无负库存
        o["barColor"] = "red";
        $idx++;
      }
    });
    if ($idx == 0) {
      item["cooked_items"].map((o) => {
        // 检查过期的库存
        if ( o.remaining_amount > 0 && get_time_to_disposal(item.best_serving_hours, o.cooked_on).replace("mins", "") * 1 < 0 ) {
          // Best serving hour elapsed notification | Not tested yet
          kitchen_notification(
            `${ item.name } is almost out of best serving hours`,
            `${ item.name } cooked long ago and quality went bad. Please dispose this item cook again.`,
            'assets/img/media/danger.png',
            true,
            5000,
            true
          );
          o["barColor"] = "grey";
          $idx++;
        }
      });
      // 计算所有批次的总量
      $totalStock = 0;
      for ($i = 0; $i < item["cooked_items"].length; $i++) {
        $totalStock += item["cooked_items"][$i]["remaining_amount"] * 1;
      }
      if ($totalStock < (item["safety_level"] * item["maximum_amount"]) / 100) {
        $idx++;
        item["cooked_items"].map((o) => {
          // 检查有无负库存
          // Below safety level notification | Not tested yet
          kitchen_notification(
            `${ item.name } is below safety level`,
            `You are running out of ${ item.name } and need to cook more.`,
            'assets/img/media/danger.png',
            true,
            5000,
            true
          );
          o["barColor"] = "yellow";
        });
      }
    }
    //
    if ($idx > 0) {
      let div = `
				<li class="item" data-item-id="${item.id}">
					<a href="javascript:;" class="d-flex align-items-center justify-content-start" onclick="select_item('${item.id}')">
						<img src="image/${item.id}.jpg" class="widget-img widget-img-sm rounded"/>
						<p class="w-50 m-0 m-l-10">${item.name}</p>
						<p class="label bg-red">${$idx}</p>
					</a>
				</li>
			`;
      $(".item-list").append($(div));
    } else {
      let div = `
				<li class="item" data-item-id="${item.id}">
					<a href="javascript:;" class="d-flex align-items-center justify-content-start" onclick="select_item('${item.id}')">
						<img src="image/${item.id}.jpg" class="widget-img widget-img-sm rounded"/>
						<p class="w-50 m-0 m-l-10">${item.name}</p>
					</a>
				</li>
			`;
      $(".item-list").append($(div));
    }
  });

  if (defaultMaterialID == -1) {
    select_item(data[0].id);
    if (data.length != 0) {
      defaultMaterialID = data[0].id;
      localStorage.setItem('selectedMaterialId', defaultMaterialID);
    }
  } else {
    select_item(defaultMaterialID)
    render_item_detail(defaultMaterialID);
  }
};

// 改变选择左边的列表
let select_item = (id) => {
  // Select an item from item list
  selected_item_id = id;
  defaultMaterialID = id;
  localStorage.setItem('selectedMaterialId', defaultMaterialID);
  $(".item").removeClass("active");
  $(".raw-material").removeClass("active");
  $(`li[data-item-id=${id}]`).addClass("active");
  $(".item-details").parent().find(".widget-header-title").text("Item details");
  render_item_detail(id);
};

// 选择 左边列表后的右边样式
let render_item_detail = (id) => {
  if (id == -1) {
    // render raw materials
    return;
  }
  // Renders item detail in the main content
  let item = [...materials.filter((item) => item.id == id)][0];
  currentCode = item["code"];
  // 获得真正的cooked item的数量
  $cookedCounts = 0;
  for ($i = 0; $i < item["cooked_items"].length; $i++) {
    if (item["cooked_items"][$i]["remaining_amount"] > 0) $cookedCounts++;
  }
  let template = `
    <div class="vertical-box-column p-t-15 p-b-15" style="width: 30%;">
      <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-around">
        <span class="p-l-20 p-r-20 f-s-15 f-w-700 w-100 m-b-10">${ item.name }</span>
        <img class="rounded item-image" src="image/${item.id}.jpg" alt="">
        <div class="widget-chart-info w-100 p-l-20 p-r-20">
          <hr>
          <div class="item-description height-150">
            <span class="f-s-15 f-w-700">Cooking procedure </span>
            <div class="m-t-10 f-s-12" style="overflow:hidden">${ item.receipe }</div>
          </div>
          <hr>
          <div class="item-attributes height-150">
            <span class="f-s-15 f-w-700">Attributes </span>
            <ul class="m-t-20">
              <li><i class="fa fa-circle"></i><span class="f-s-12">Best serving time: ${ item.best_serving_hours } min</span></li>
              <li><i class="fa fa-circle"></i><span class="f-s-12">Cooking time: ${ item.cooking_time } min</span></li>
              <li><i class="fa fa-circle"></i><span class="f-s-12">Safety level: ${ item.safety_level } %</span></li>
              <li><i class="fa fa-circle"></i><span class="f-s-12">Maximum amount: ${ item.maximum_amount } (g)</span></li>
            </ul>
          </div>
          <hr style="margin-top: 19px;">
          <div class="d-flex justify-content-between align-items-center">
            <button class="btn btn-md width-120 btn-success" type="button" name="button" onclick="cook_item(${ item.id })">Cook</button>
            <button class="btn btn-md width-120 btn-danger" type="button" name="button" onclick="soldout_item(${ item.id })">
              ${(() => {
                if (typeof item.sellOut == "undefined" || item.sellOut == 1) {
                  return `Click To Sell Out`;
                } else {
                  return `Click To On Sell`;
                }
              })()}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="vertical-box-column p-15" style="width: 70%;">
      <div class="widget-chart-info" style="height: 250px; overflow: auto;">
        <div class="d-flex justify-content-between align-items-center position-sticky top-0 m-b-10" style="top: 0; background: white; border-bottom: 1px solid rgba(0,0,0,.1);">
          <div>
            ${(() => {
              if (item.cooking_items.length != 0) {
                return `<h4 class="widget-chart-info-title">Current cooking (${item.cooking_items.length})</h4><p class="widget-chart-info-desc m-b-10">You are cooking ${item.cooking_items.length} batch at the moment. Please check quality before the food is ready.</p>`;
              } else {
                return `<h4 class="widget-chart-info-title">There are no cooking items.</h4>`;
              }
            })()}
          </div>
        </div>
        <div class="cooking-batches">
          ${(() => {
            // Cooking items
            if (item.cooking_items.length != 0) {
              let cooking_items = ``;
              item.cooking_items.map((_item) => {
                if (!_item["has_dispose"]) {
                  // 判断当前的item是否已经超过了cooking的时间
                  let currentCookingMin = get_elapsed_hr_min(_item.started_cooking_time).min + get_elapsed_hr_min(_item.started_cooking_time).hr * 60;
                  cooking_items += `
                    <div class="batch d-flex justify-content-between aligh-items-center m-b-15">
                      <div class="batch-info m-r-15" style="width: 85%;">
                        <div class="widget-chart-info-progress d-flex justify-content-between">
                          <div>#${get_batch_number(_item.id)}</div>
                          <div>
                            <b>Started: ${moment(_item.started_cooking_time, "MM-DD HH:mm" ).format("HH:mm")}</b>
                            <span>(${get_elapsed_time_string(get_elapsed_hr_min(_item.started_cooking_time))} ago)</span>
                          </div>
                          <div><b>Amount: ${_item.cooking_amount} (g)</b></div>
                          <span class="pull-right">${Math.floor((_item.cooking_amount / item.maximum_amount) * 100)}%</span>
                        </div>
                        <div class="progress progress-sm">
                          <div class="progress-bar progress-bar-striped progress-bar-animated rounded-corner bg-teal-lighter" style="width: ${Math.floor((_item.cooking_amount / item.maximum_amount) * 100)}%;"></div>
                        </div>
                      </div>
                      ${ (() => {
                        if(currentCookingMin >= item.cooking_time){
                          //
                          return `<button class="btn btn-sm btn-primary d-flex align-items-center m-l-5 width-90 p-l-5 p-r-5" type="button" name="button" onclick="ready_item('${ item.id }', '${ _item.id }',true)">
                                    <i class="fa fa-check m-r-5"></i>Ready
                                  </button>`;
                        }else{
                          return `<button class="btn btn-sm btn-default d-flex align-items-center m-l-5 width-90 p-l-5 p-r-5" type="button" name="button" >
                                    <i class="fa fa-hourglass m-r-5"></i>Cooking
                                  </button>`;
                        }
                      })() }
                      <button class="btn btn-sm btn-danger d-flex align-items-center m-l-5 m-r-5 width-90 p-l-5 p-r-5" type="button" name="button" onclick="ready_item('${ item.id }', '${ _item.id }',false)">
                        <i class="fa fa-times m-r-5"></i>Dispose
                      </button>
                    </div>
                  `;
                }
              });
              return cooking_items;
            } else {
              return `<button class="btn btn-sm btn-success m-t-20" onclick="cook_item(${item.id})">Start cooking</button>`;
            }
          })()}
        </div>
      </div>
      <hr>
      <div class="widget-chart-info" style="height: 250px; overflow: auto;">
        <h4 class="widget-chart-info-title">Cooked batches (${$cookedCounts})</h4>
        <p class="widget-chart-info-desc">You have ${$cookedCounts} cooked batches at the moment.</p>
        <div class="cooked-batches">
          ${(() => {
            if (item.cooked_items.length != 0) {
              let cooked_items = ``;
              item.cooked_items.map((_item) => {
                if (_item["remaining_amount"] > 0) {
                  cooked_items += `
                    <div class="batch d-flex justify-content-between align-items-center">
                      <div class="batch-info" style="width: 85%">
                        <div class="widget-chart-info-progress d-flex justify-content-between">
                          <div class="width-200">
                            <b>Cooked: ${moment(_item.cooked_on, "MM-DD HH:mm").format("HH:mm")} </b> <span>(${get_elapsed_time_string(get_elapsed_hr_min(_item.cooked_on))} ago)</span>
                          </div>
                          <div class="width-200">
                            <b>Time to dispose: ${(() => {
                              let time_string = get_time_to_disposal(item.best_serving_hours, _item.cooked_on);
                              if (time_string.indexOf("-") != -1) {
                                return `<span class="text-danger">${time_string}</span>`;
                              } else {
                                return time_string;
                              }
                            })()} </b>
                          </div>
                          <div class="width-150"><b>Remaining: ${_item.remaining_amount} (g)</b></div>
                          <span class="pull-right">${Math.floor((_item.remaining_amount / item.maximum_amount) * 100)}%</span>
                        </div>
                        <div class="progress progress-sm m-b-15">
                          <div class="progress-bar progress-bar-striped progress-bar-animated rounded-corner bg-${_item["barColor"]}-darker" style="width: ${Math.floor((_item.remaining_amount / item.maximum_amount) * 100)}%"></div>
                        </div>
                      </div>
                      <button class="btn btn-sm btn-danger d-flex justify-content-center align-items-center m-l-5 p-l-5 p-r-5 width-90" type="button" name="button"  onclick="dispose_item('${ item.id }', '${ _item.id }')"><i class="fa fa-times m-r-5"></i>Dispose</button>
                    </div>
                  `;
                } else if (_item["remaining_amount"] < 0) {
                  cooked_items += `
                    <div class="batch d-flex justify-content-between align-items-center">
                      <div class="batch-info" style="width: 85%">
                        <div class="widget-chart-info-progress d-flex justify-content-between">
                          <div class="width-200 text-red-darker">
                            <b>Negative inventory </b>
                          </div>
                          <div class="width-150 text-red-darker"">
                            <b>Remaining: ${_item.remaining_amount} (g)</b>
                          </div>
                          <span class="pull-right text-red-darker"">${Math.floor(
                            (_item.remaining_amount / item.maximum_amount) * 100
                          )}%</span>
                        </div>
                        <div class="progress progress-sm m-b-15">
                          <div class="progress-bar progress-bar-striped progress-bar-animated rounded-corner bg-red-darker" style="width: ${Math.abs(Math.floor((_item.remaining_amount / item.maximum_amount) * 100))}%"></div>
                        </div>
                      </div>
                    </div>
                  `;
                }
              });
              return cooked_items;
            } else {
              return "";
            }
          })()}
        </div>
      </div>
      <hr>
      <div class="widget-chart-info">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h4 class="widget-chart-info-title">Disposal info</h4>
            <p class="widget-chart-info-desc">${
              (() =>{
                let qty = 0
                let amount = 0
                let disposals = get_disposal_history()
                disposals.forEach(disposal => {
                  if(disposal.item_id == item.id){
                    qty++
                    amount += parseInt(disposal.amount)
                  }
                })
                return qty != 0 ? `You disposed ${qty} times today. Total disposal amount is ${amount}g` : `There are no disposal for this item. `
              })()
            }</p>
          </div>
          <button class="btn btn-md btn-indigo width-90" type="button" name="button" onclick="dispose_history(${item.id})">
            <i class="fa fa-history m-r-5"></i>History
          </button>
        </div>
      </div>
    </div>
  `;
  $(".item-details").empty();
  $(".item-details").append($(template));
};

// 点击cook按钮
let cook_item = (id) => {
  //let data = get_data();
  data = materials;
  let item = [...data.filter((item) => item.id == id)][0];
  $("#cook-item-modal .modal-header h4").text(
    "You are going to cook " + item.name
  );
  $("#cook-item-modal input").attr("item-id", id);
  cook_option = "batch";
  if (cook_option == "batch") {
    $('#cook-item-modal input[value="batch"]').prop("checked", true);
  } else {
    $('#cook-item-modal input[value="amount"]').prop("checked", true);
  }
  $("#cook-item-modal").attr("item-id", id);
  cook_option_render(id);
  $("#cook-item-modal").modal("show");
};
let cook_option_render = (id) => {
  let data = materials;
  let item = [...data.filter((item) => item.id == id)][0];
  let template = `
      <div class="w-100 d-flex justify-content-between">
        <div class="item-attributes height-200 w-50">
          <span class="f-s-15 f-w-700">Attributes </span>
          <ul class="m-t-20">
            <li><i class="fa fa-circle"></i><span class="f-s-14">Best serving time: ${item.best_serving_hours} min</span></li>
            <li><i class="fa fa-circle"></i><span class="f-s-14">Cooking time: ${item.cooking_time} min</span></li>
            <li><i class="fa fa-circle"></i><span class="f-s-14">Safety level: ${item.safety_level} %</span></li>
            <li><i class="fa fa-circle"></i><span class="f-s-14">Maximum amount: ${item.maximum_amount} (g)</span></li>
          </ul>
        </div>
        <div class="w-50">
          ${(() => {
            if (cook_option == "batch") {
              return `
                <div class="m-b-20"><span class="f-s-15 f-w-700">Batches </span></div>
                <div class="custom-control custom-radio m-b-10">
                  <input class="custom-control-input" type="radio" name="batch_count" id="batch_0" value="0">
                  <label class="custom-control-label" for="batch_0">Small batch (${item.maximum_amount / 2} g)</label>
                </div>
                <div class="custom-control custom-radio m-b-10">
                  <input class="custom-control-input" type="radio" name="batch_count" id="batch_1" value="1" checked>
                  <label class="custom-control-label" for="batch_1">1 batch (${item.maximum_amount} g)</label>
                </div>
                <div class="custom-control custom-radio m-b-10">
                  <input class="custom-control-input" type="radio" name="batch_count" id="batch_2" value="2">
                  <label class="custom-control-label" for="batch_2">2 batches (${item.maximum_amount * 2} g)</label>
                </div>
                <div class="custom-control custom-radio m-b-10">
                  <input class="custom-control-input" type="radio" name="batch_count" id="batch_3" value="3">
                  <label class="custom-control-label" for="batch_3">3 batches (${item.maximum_amount * 3} g)</label>
                </div>
                <div class="custom-control custom-radio m-b-10 d-flex align-items-center">
                  <input class="custom-control-input" type="radio" name="batch_count" id="batch_custom" value="4">
                  <label class="custom-control-label" for="batch_custom">Custom batches</label>
                  <div class="custom_batch_amount d-none align-items-center ml-5 justify-content-around" style="width: 160px">
                    <a class="btn btn-primary btn-icon btn-circle btn-lg custom_batch_minus">
                      <i class="fas fa-minus text-white"></i>
                    </a>
                    <input type="number" step="1" max="100" min="1" id="custom_batch_amount" value="4"/>
                    <a class="btn btn-primary btn-icon btn-circle btn-lg custom_batch_plus">
                      <i class="fas fa-plus text-white"></i>
                    </a>
                  </div>
                </div>
              `;
            }else{
              return `
                <div class="m-b-20"><span class="f-s-15 f-w-700">Input custom amount </span></div>
                <div class="d-flex w-100">
                  <div class="w-50">
                    <input type="text" class="form-control item_amount" maximum-amount="${item.maximum_amount}" placeholder="Maximum: ${item.maximum_amount}" />
                    <div class="m-t-5 item_percent"></div>
                  </div>
                  <div class="keyboard d-flex w-50 flex-row justify-content-between p-r-20 p-l-20 flex-wrap">
                    <div onclick="key_tap('1')">1</div>
                    <div onclick="key_tap('2')">2</div>
                    <div onclick="key_tap('3')">3</div>
                    <div onclick="key_tap('4')">4</div>
                    <div onclick="key_tap('5')">5</div>
                    <div onclick="key_tap('6')">6</div>
                    <div onclick="key_tap('7')">7</div>
                    <div onclick="key_tap('8')">8</div>
                    <div onclick="key_tap('9')">9</div>
                    <div onclick="key_tap('-2')"><i class="fa fa-times"></i></div>
                    <div onclick="key_tap('0')">0</div>
                    <div onclick="key_tap('-1')"><i class="fa fa-arrow-left"></i></div>
                  </div>
                </div>
              `;
            }
          })()}
        </div>
      </div>
    `;
  $(".cook_option").empty();
  $(".cook_option").append($(template));
  $("input[name='batch_count']").click(function(){
    if($(this).prop('id') == 'batch_custom'){
      $(".custom_batch_amount").addClass('d-flex')
      $(".custom_batch_amount").removeClass('d-none')
    }else{
      $(".custom_batch_amount").removeClass('d-flex')
      $(".custom_batch_amount").addClass('d-none')
    }
  })
  $("#custom_batch_amount").change(function(){
    $("#batch_custom").val($(this).val())
  })
  $('.custom_batch_minus').click(function(){
    if(parseInt($("#custom_batch_amount").val()) > 1){
      $("#custom_batch_amount").val(parseInt($("#custom_batch_amount").val()) - 1)
    }
  })
  $('.custom_batch_plus').click(function(){
    $("#custom_batch_amount").val(parseInt($("#custom_batch_amount").val()) + 1)
  })
};

// 點擊確認cook按鈕
let confirm_cook_item = (id) => {
  //let data = get_data();
  let last_batch_number = 0
  cookingList = [];
  data = materials;
  let item = [...data.filter((item) => item.id == id)][0];

  last_batch_number = get_last_batch_number(id)
  let amount = 0;
  let batch = $('input[name="batch_count"]:checked').val();
  let sm = false;
  if (cook_option == "batch") {
    if (batch == 0) {
      amount = item.maximum_amount / 2;
    } else {
      amount = item.maximum_amount;
    }
  } else {
    amount = $(".item_amount").val();
    if (amount == "") {
      amount = 0;
    }
    if (amount == 0) {
      return;
    }
    cookingList.push({
      id: generate_id(),
      cooking_amount: amount,
      started_cooking_time: moment().format("MM-DD HH:mm"),
      batch_number: last_batch_number + 1
    });
  }
  if (batch == 0) {
    batch++;
    sm = true;
  }
  for (let i = 0; i < batch; i++) {
    last_batch_number++
    cookingList.push({
      id: generate_id(),
      cooking_amount: amount,
      started_cooking_time: moment().format("MM-DD HH:mm"),
      batch_number: last_batch_number
    });
  }
  $hasSuccess = true;
  for ($i = 0; $i < cookingList.length; $i++) {
    $requestJson = cookingList[$i];
    $requestJson["materialID"] = item["code"];
    $requestJson["status"] = 1;
    if (addOrChangeCookItem($requestJson)) {
      item.cooking_items.push({
        id: cookingList[$i]["id"],
        cooking_amount: cookingList[$i]["cooking_amount"],
        started_cooking_time: cookingList[$i]["started_cooking_time"],
        batch_number: cookingList[$i]["last_batch_number"]
      });
    } else {
      $hasSuccess = false;
    }
  }

  cookingList.forEach(item => {
    save_batch_info({
      item_id: id,
      batch_item_id: item.id,
      batch_number: item.batch_number
    })
  })

  $("#cook-item-modal").modal("hide");

  if ($hasSuccess) {
    kitchen_notification(
      "Cooking started!",
      `You started cooking ${item.name} ${(() => {
        if (cook_option != "batch") {
          return `${amount} g`;
        } else {
          if (sm) {
            return `small batch. (${amount})`;
          } else {
            return `${batch} batches. (${batch * amount} g)`;
          }
        }
      })()}`,
      "assets/img/media/info.png",
      false,
      5000
    );
    // History
    let req = {
      shop_id: JSON.parse(localStorage.getItem('kitchenLogin'))['shop_id'],
      item_id: item.id,
      item_code: item.code,
      item_name: item.name,
      type: 'cooking_start',
      amount: (() => {
        if (cook_option != "batch") {
          return amount;
        } else {
          if (sm) {
            return amount;
          } else {
            return batch * amount;
          }
        }
      })(),
      reason: (() => {
        if (cook_option != "batch") {
          return 'Custom amount';
        } else {
          if (sm) {
            return 'Small batch';
          } else {
            return `${batch} batches.`;
          }
        }
      })()
    }
    kitchen_history(req);
  }
  //set_data(data);
  render_item_detail(id);
};

// 点击完成按钮
// isReady true 表示点击ready按钮，false表示点击dispose按钮
let ready_item = (item_id, cooking_item_id, isReady) => {
  data = materials;
  let item = data.filter((item) => item.id == item_id)[0];
  let cooking_item = item.cooking_items.filter(
    (_item) => _item.id == cooking_item_id
  )[0];
  let cooked_item = {
    id: cooking_item.id,
    cooked_amount: cooking_item.cooking_amount,
    remaining_amount: cooking_item.cooking_amount,
    cooked_on: moment().format("MM-DD HH:mm"),
  };

  let txt = "Please checkout the quality of the food. You can not revert this action. Do you guarantee the quality of food?";
  if (!isReady) {
    txt = "You well dispose the batch of food. You can not revert this action. Do you guarantee the the food is really bad?";
  }
  swal({
    title: "Are you sure?",
    text: txt,
    icon: "info",
    closeOnClickOutside: false,
    buttons: {
      cancel: {
        text: "No, I do not guarantee.",
        value: false,
        visible: true,
        className: "btn btn-default",
        closeModal: true,
      },
      confirm: {
        text: "Yes, I guarantee!",
        value: true,
        visible: true,
        className: "btn btn-primary",
        closeModal: true,
      },
    },
  }).then(function (result) {
    if (result) {
      $requestData = cooked_item;
      $requestData["materialID"] = item.code;
      $requestData["status"] = isReady ? 2 : 3; // 2表示ready逻辑，3表示dispose的逻辑
      if (addOrChangeCookItem($requestData)) {
        item.cooked_items.push(cooked_item);
        let idx = -1;
        for (let i = 0; i < item.cooking_items.length; i++) {
          if (item.cooking_items[i].id == cooking_item_id) {
            idx = i;
          }
        }
        if (idx != -1) {
          item.cooking_items.splice(idx, 1);
        }
        //set_data(data);
        //render_item_list();
        get_materials();
        render_item_detail(item_id);
        kitchen_notification(
          "Cooking finished!",
          `You finished cooking ${item.name} ${cooked_item.cooked_amount} g`,
          "assets/img/media/info.png",
          false,
          5000
        );
        let req = {
          shop_id: JSON.parse(localStorage.getItem('kitchenLogin'))['shop_id'],
          item_id: item.id,
          item_code: item.code,
          item_name: item.name,
          type: isReady ? 'cooking_finished' : 'dispose',
          amount: cooked_item.cooked_amount,
          reason: isReady ? 'Cooking has been finished' : 'Quality is not good'
        }
        kitchen_history(req);
        if (isReady) {
          print_cooked_item(cooking_item, item);
        }
      }
    }
  });
};

// Disposal functions
let dispose_item = (item_id, cooked_item_id) => {
  //let data = get_data();
  let data = materials;
  let item = data.filter((item) => item.id == item_id)[0];
  let cooked_item = item.cooked_items.filter(
    (_item) => _item.id == cooked_item_id
  )[0];
  $("#dispose-item-modal").attr("item-id", item_id);
  $("#dispose-item-modal").attr("cooked-item-id", cooked_item_id);
  $("#dispose-item-modal .modal-header h4").text(
    "You are going to dispose " + item.name
  );
  $("#dispose-item-modal .dispose_option").empty();
  $("#dispose-item-modal .dispose_option").append(
    $(`
      <div class="w-100 d-flex justify-content-between">
        <div class="w-50">
            <span class="f-s-15 f-w-700">Attributes </span>
            <ul class="m-t-10">
                <li><i class="fa fa-circle"></i><span class="f-s-14">Cooked on: ${cooked_item.cooked_on}(${get_elapsed_time_string(get_elapsed_hr_min(cooked_item.cooked_on))} ago)</span></li>
                <li><i class="fa fa-circle"></i><span class="f-s-14">Time to dispose: ${get_time_to_disposal(item.best_serving_hours, cooked_item.cooked_on)}</span></li>
                <li><i class="fa fa-circle"></i><span class="f-s-14">Current amount: ${  cooked_item.remaining_amount} g</span></li>
                <li><i class="fa fa-circle"></i><span class="f-s-14">Remaining percent: ${Math.floor((cooked_item.remaining_amount / item.maximum_amount) * 100)}%</span></li>
            </ul>
        </div>
        <div class="w-50">
          <div class="m-b-20"><span class="f-s-15 f-w-700">Input disposal amount </span></div>
          <div class="d-flex w-100">
            <div class="w-50 d-flex flex-column justify-content-between align-items-end">
              <div class="w-100">
                  <input type="text" class="form-control dispose_amount" maximum-amount="${cooked_item.remaining_amount}" placeholder="Maximum: ${cooked_item.remaining_amount}"/>
                  <div class="m-t-5 dispose_remaining">Remaining after disposal: ${cooked_item.remaining_amount} g</div>
                  <div class="w-100">
                    <span class="f-s-15 f-w-700">Disposal reason </span>
                    <div class="custom-control custom-radio m-t-5 m-b-5">
                      <input class="custom-control-input" type="radio" name="disposal_reason" id="reason_0" value="Comsume for customers" checked>
                      <label class="custom-control-label" for="reason_0">Comsume for customers</label>
                    </div>
                    <div class="custom-control custom-radio m-b-5">
                      <input class="custom-control-input" type="radio" name="disposal_reason" id="reason_1" value="Best serving time out">
                      <label class="custom-control-label" for="reason_1">Best serving time out</label>
                    </div>
                    <div class="custom-control custom-radio m-b-5">
                      <input class="custom-control-input" type="radio" name="disposal_reason" id="reason_2" value="Not needed anymore">
                      <label class="custom-control-label" for="reason_2">Not needed anymore</label>
                    </div>
                    <div class="custom-control custom-radio m-b-5">
                      <input class="custom-control-input" type="radio" name="disposal_reason" id="reason_3" value="Something is in the food">
                      <label class="custom-control-label" for="reason_3">Something is in the food</label>
                    </div>
                    <div class="custom-control custom-radio m-b-5">
                      <input class="custom-control-input" type="radio" name="disposal_reason" id="reason_4" value="Other">
                      <label class="custom-control-label" for="reason_4">Other</label>
                    </div>
                  </div>
                </div>
                <button class="btn btn-sm btn-danger width-90 m-b-10" onclick="key_tap_dispose('-3')">Dispose all</button>
            </div>
            <div class="keyboard d-flex w-50 flex-row justify-content-between p-r-20 p-l-20 flex-wrap">
              <div onclick="key_tap_dispose('1')">1</div>
              <div onclick="key_tap_dispose('2')">2</div>
              <div onclick="key_tap_dispose('3')">3</div>
              <div onclick="key_tap_dispose('4')">4</div>
              <div onclick="key_tap_dispose('5')">5</div>
              <div onclick="key_tap_dispose('6')">6</div>
              <div onclick="key_tap_dispose('7')">7</div>
              <div onclick="key_tap_dispose('8')">8</div>
              <div onclick="key_tap_dispose('9')">9</div>
              <div onclick="key_tap_dispose('-2')"><i class="fa fa-times"></i></div>
              <div onclick="key_tap_dispose('0')">0</div>
              <div onclick="key_tap_dispose('-1')"><i class="fa fa-arrow-left"></i></div>
            </div>
          </div>
        </div>
      </div>
    `)
  );
  $("#dispose-item-modal").modal("show");
};

let confirm_dispose_item = (item_id, cooked_item_id) => {
  let disposal_amount = $(".dispose_amount").val();
  if (disposal_amount == "" || disposal_amount == "0") {
    return false; // Invalid amount.
  } else {
    $("#dispose-item-modal").modal("hide");
    //let data = get_data();
    let data = materials;
    let item = data.filter((item) => item.id == item_id)[0];
    let cooked_item = item.cooked_items.filter(
      (_item) => _item.id == cooked_item_id
    )[0];
    let disposal_reason = $('input[name="disposal_reason"]:checked').val();

    if (cooked_item["remaining_amount"] < disposal_amount) {
      disposal_amount = cooked_item["remaining_amount"];
    }

    $requestJson = {};
    $requestJson["materialID"] = item["code"];
    $requestJson["id"] = cooked_item_id;
    $requestJson["amount"] = disposal_amount;

    if (changeQuantity($requestJson)) {
      if (cooked_item.remaining_amount == disposal_amount) {
        // Remove item
        let idx = -1;
        for (let i = 0; i < item.cooked_items.length; i++) {
          if (item.cooked_items[i].id == cooked_item_id) {
            idx = i;
            break;
          }
        }
        if (idx != -1) {
          item.cooked_items.splice(idx, 1);
        }
      } else {
        cooked_item.remaining_amount =
          cooked_item.remaining_amount - disposal_amount;
      }
      kitchen_notification(
        "Item disposed!",
        `You disposed ${item.name} ${disposal_amount} g, Reason: ${disposal_reason}`,
        "assets/img/media/info.png",
        false,
        5000
      );
      add_disposal_history({
        uid: generate_id(),
        item_id: item.id,
        amount: disposal_amount,
        reason: disposal_reason,
        time: moment().format('YYYY-MM-DD hh:mm:ss')
      })
      let req = {
        shop_id: JSON.parse(localStorage.getItem('kitchenLogin'))['shop_id'],
        item_id: item.id,
        item_code: item.code,
        item_name: item.name,
        type: 'dispose',
        amount: disposal_amount,
        reason: disposal_reason
      }
      kitchen_history(req);
      //set_data(data);
      render_item_detail(item_id);
    }
  }
};

let dispose_history = (id) => {
  let disposals = get_disposal_history().filter(item => item.item_id == id)
  $("#disposal-history-modal").modal("show");
  let tag = `There are no disposals today.`
  if(disposals.length > 0){
    let tds = ``
    let total_amount = 0
    disposals.forEach((item, idx) => {
      total_amount += parseInt(item.amount)
      tds += `
        <tr>
          <td>${idx+1}</td>
          <td>${moment(item.timestamp).format('DD ddd, MMM')}</td>
          <td>${item.amount}g</td>
          <td>${item.reason}</td>
        </tr>
      `
    })
    tag = `
      <div>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Timestamp</th>
              <th>Amount</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${
              tds
            }
            <tr>
              <td>-</td>
              <td>Total disposal amount</td>
              <td class="text-red">${total_amount}g</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  }
  $("#disposal-history-modal .disposal_history").html(tag)
};
let soldout_item = (id) => {
  let data = materials;
  let item = data.filter((item) => item.id == defaultMaterialID)[0];
  if (!item["sellOut"] || item["sellOut"] == 1) {
    // 表示当前物料on sale，需要切换成sell out
    $("#sellOutTitle").html("Confirm to sell out");
  } else item["sellOut"] == 2;
  {
    // 表示当前物料sell out，需要切换成on sell
    $("#sellOutTitle").html("Confirm to on sell");
  }
  $("#sell-out-modal").modal("show");
};

// sold 取消和反取消
let soldoutInterface = () => {
  $("#sell-out-modal").modal("hide");
  $request = {};
  $request["code"] = currentCode;
  let item = data.filter((item) => item.id == defaultMaterialID)[0];
  if (typeof item["sellOut"] == "undefined" || item["sellOut"] == 1) {
    // 表示当前物料on sale，需要切换成sell out
    $request["status"] = 2;
  } else if (item["sellOut"] == 2) {
    console.log("123123");
    // 表示当前物料sell out，需要切换成on sell
    $request["status"] = 1;
  }

  $flag = false;
  $.ajax({
    method: "post",
    url: window.location.origin + "/sellOut",
    data: JSON.stringify($request),
    async: false,
    beforeSend: function () {},
    success: function (data) {
      $flag = data == 1;
      item["sellOut"] = $request["status"];
    },
    error: function (data) {
      console.log(data);
    },
    complete: function (data) {
      render_item_detail(item["id"]);
    },
  });
  return $flag;
};

// 修改cook的数量
function changeQuantity($cookJson) {
  $flag = false;
  $.ajax({
    method: "post",
    url: window.location.origin + "/changeCookedQuantity",
    data: JSON.stringify($cookJson),
    async: false,
    success: function (data) {
      $flag = data == 1;
    },
    error: function (data) {
      console.log(data);
    },
  });
  return $flag;
}

// 修改cook的状态
function addOrChangeCookItem($cookJson) {
  $flag = false;
  $.ajax({
    method: "post",
    url: window.location.origin + "/addMaterialCook",
    data: JSON.stringify($cookJson),
    async: false,
    beforeSend: function () {},
    success: function (data) {
      $flag = data == 1;
    },
    error: function (data) {
      console.log(data);
    },
    complete: function (data) {},
  });
  return $flag;
}

$(document).ready(function () {
  init();
  // Render item list
  //render_item_list()
});

let key_tap = (key) => {
  let val = $(".item_amount").val();
  let max = $(".item_amount").attr("maximum-amount");
  if (key == "-1") {
    val = val.slice(0, -1);
  } else if (key == "-2") {
    val = "";
  } else {
    val += key;
  }
  if (val.length != 1 && val[0] == "0") {
    val = val.slice(1);
  }
  if (val == "") {
    val = 0;
  }
  $(".item_amount").val(val);
  if (parseInt(val) <= parseInt(max)) {
    $(".item_amount").removeClass("text-red");
    $(".item_percent").text(
      `${Math.floor((parseInt(val) / parseInt(max)) * 100)} %`
    );
  } else {
    $(".item_amount").addClass("text-red");
    $(".item_percent").text(
      `Invalid amount. You need to input smaller than maximum amount.(${max}g)`
    );
  }
};
let key_tap_dispose = (key) => {
  let val = $(".dispose_amount").val();
  let max = $(".dispose_amount").attr("maximum-amount");
  if (key == "-1") {
    val = val.slice(0, -1);
  } else if (key == "-2") {
    val = "";
  } else if (key == "-3") {
    val = max;
  } else {
    val += key;
  }
  if (val.length != 1 && val[0] == "0") {
    val = val.slice(1);
  }
  if (val == "") {
    val = 0;
  }
  $(".dispose_amount").val(val);
  if (parseInt(val) <= parseInt(max)) {
    $(".dispose_amount").removeClass("text-red");
    $(".dispose_remaining").text(`Remaining after disposal: ${max - val} g`);
  } else {
    $(".dispose_amount").addClass("text-red");
    $(".dispose_remaining").text(
      `Invalid amount. You need to input smaller than maximum amount.(${max}g)`
    );
  }
};
$('input[name="cook_option"]').change(function () {
  cook_option = $(this).val();
  cook_option_render($(this).attr("item-id"));
});
$(".confirm_start_cooking").click(function () {
  confirm_cook_item($("#cook-item-modal").attr("item-id"));
});
$(".confirm_dispose_item").click(function () {
  confirm_dispose_item(
    $("#dispose-item-modal").attr("item-id"),
    $("#dispose-item-modal").attr("cooked-item-id")
  );
});

$('.clear_history').click(function(){
  clear_disposal_history()
})

let print_cooked_item = (cooking_item, item) => {
  let batch_number = get_batch_number(cooking_item.id) ? get_batch_number(cooking_item.id) : 'Unset'
  console.log(batch_number)
  var print_window = window.open(
    "",
    "PRINT Cooked item",
    "height=800,width=1200"
  );
  var date = new Date();
  print_window.document.write(`
      <!DOCTYPE html>
      <html lang="en" dir="ltr">
        <head>
          <meta charset="utf-8">
          <title>Print Cooked item</title>
        </head>
        <style>
          body{
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .content{
            width: 400px;
            height: 600px;
            border: 1px solid #e0e0e0;
          }
          h1{
            text-align: center;
          }
          .item-content{
            margin: 40px;
            height: 500px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        </style>
        <body>
          <div class="content">
            <h1>You cooked ${item.name}</h1>
            <div class="item-content">
              <div>
                <h3>Name: ${item.name}</h3>
                <h3>Amount: ${cooking_item.cooking_amount} g</h3>
                <h3>Batch number: #${batch_number}</h3>
                <h3>Cooking started on: ${moment(
                  cooking_item.started_cooking_time,
                  "MM-DD HH:mm"
                ).format("DD MMM, YYYY HH:mm")}</h3>
                <h3>Cooking finished on: ${moment(
                  new Date(),
                  "MM-DD HH:mm"
                ).format("DD MMM, YYYY HH:mm")}</h3>
                <h3>Time to dispose: ${moment(
                  new Date(
                    date.setMinutes(date.getMinutes() + item.best_serving_hours)
                  ),
                  "MM-DD HH:mm"
                ).format("DD MMM, YYYY HH:mm")}</h3>
              </div>
              <div style="margin-bottom: 40px; text-align: center;">
                <p>Thank you for your business.</p>
                <p>@2020 WUSHILAND BOBA</p>
              </div>
            </div>
          </div>
        </body>
      </html>
  `);
  print_window.print();
  print_window.close();

  return true;
};

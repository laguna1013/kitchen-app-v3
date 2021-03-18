let materials = [];
let notify = [];
let audio = undefined;
// 获得materials的档案，只获取material的内容不获取具体数据
let get_materials = () => {
  $.ajax({
    method: "post",
    url: window.location.origin + "/getMaterials",
    data: {},
    async: false,
    beforeSend: function () {},
    success: function (data) {
		//console.log(data);
      if (data!=1) {
        $returnJson = JSON.parse(data);
        if ($returnJson["data"]) {
          $.each($returnJson["data"], function () {
            $hasMaterial = false;
            $idx = -1;
            // 检查单个material是否存在内存中
            for ($i = 0; $i < materials.length; $i++) {
              if (materials[$i]["id"] == $(this)[0]["id"]) {
                $idx = $i;
                $hasMaterial = true;
              }
            }
            if (!$hasMaterial) {
              // 不存在直接添加
              materials.push($(this)[0]);
            } else {
              // 如果存在修改相应material的内容
              materials[$idx]["code"] = $(this)[0]["code"];
              materials[$idx]["name"] = $(this)[0]["name"];
              materials[$idx]["ingredients"] = $(this)[0]["ingredients"];
              materials[$idx]["recipe"] = $(this)[0]["recipe"];
              materials[$idx]["best_serving_hours"] = $(this)[0][
                "best_serving_hours"
              ];
              materials[$idx]["safety_level"] = $(this)[0]["safety_level"];
              materials[$idx]["cooking_time"] = $(this)[0]["cooking_time"];
              materials[$idx]["maximum_amount"] = $(this)[0]["maximum_amount"];
              materials[$idx]["advise_dosage"] = $(this)[0]["advise_dosage"];
              materials[$idx]["cooked_items"] = $(this)[0]["cooked_items"];
              materials[$idx]["cooking_items"] = $(this)[0]["cooking_items"];
              materials[$idx]["sellOut"] = $(this)[0]["sellOut"];
            }
          });
        }
      }
	  else
	  {
		console.log("1");
	 }
    },
    error: function (data) {},
    complete: function (data) {
      render_item_list();
    },
  });
};

let get_data = () => {
  if (!localStorage.getItem("itemListData")) {
    localStorage.setItem("itemListData", JSON.stringify(all_items)); // all_times should be replaced with server data. Located in data.js file.
    return all_items;
  } else {
    return JSON.parse(localStorage.getItem("itemListData"));
  }
};

let get_raw_data = () => {
  // Get item data from local storage. If there is no data in localstorage, it will look up server data.
  if (!localStorage.getItem("rawMaterialData")) {
    localStorage.setItem("rawMaterialData", JSON.stringify(raw_materials)); // all_times should be replaced with server data. Located in data.js file.
    return raw_materials;
  } else {
    return JSON.parse(localStorage.getItem("rawMaterialData"));
  }
};
let set_data = (data) => {
  // Set item data to local storage
  localStorage.setItem("itemListData", JSON.stringify(data));
};
let set_raw_data = (data) => {
  // Set item data to local storage
  localStorage.setItem("rawMaterialData", JSON.stringify(data));
};
let get_elapsed_hr_min = (time) => {
  return {
    hr: Math.abs(0),
    min: Math.abs(moment().diff(moment(time, "MM-DD HH:mm"), "minutes")),
  };
  // let hr = Math.trunc(moment().diff(moment(time, 'MM-DD HH:mm'), 'minutes') / 60);
  // let min = moment().diff(moment(time, 'MM-DD HH:mm'), 'minutes') % 60;
  // if(hr < 0) hr += 24;
  // if(min < 0){
  //     if(hr == 0){
  //         hr = 23;
  //     }
  //     min += 60;
  // }
  // return {
  //     hr: Math.abs(hr),
  //     min: Math.abs(min)
  // };
};
let get_elapsed_time_string = (hr_min) => {
  if (hr_min.hr == 0) {
    if (hr_min.min == 1 || hr_min.min == 0) {
      return hr_min.min + " min";
    } else {
      return hr_min.min + " mins";
    }
  } else {
    if (hr_min.min == 1 && hr_min.min == 0) {
      return hr_min.hr + " hr " + hr_min.min + " min";
    } else {
      return hr_min.hr + " hr " + hr_min.min + " mins";
    }
  }
};
let get_time_to_disposal = (bs_hr, cooked_time) => {
  return get_elapsed_time_string({
    hr: 0,
    min: moment(cooked_time, "MM-DD HH:mm")
      .add(bs_hr, "minutes")
      .diff(moment(), "minutes"),
  });
  // let diff = moment(cooked_time, 'MM-DD HH:mm').add(bs_hr, 'hours').diff(moment(), 'minutes');
  // let hr = Math.trunc(diff / 60);
  // let min = diff % 60;
  // return get_elapsed_time_string({
  //     hr: hr,
  //     min: min
  // })
};

let play_sound = (sound_file) => {
  let current = new Date().getTime()
  let last_sound_played_time = localStorage.getItem('last_sound_played_time') ? localStorage.getItem('last_sound_played_time') : 0
  if((last_sound_played_time == 0) || ((current - last_sound_played_time) > 10 * 1000)){
    audio = new Audio(sound_file)
    audio.play()
    localStorage.setItem('last_sound_played_time', new Date().getTime())
  }else{
    return
  }
}

let generate_id = () => {
  return "_" + Math.random().toString(36).substr(2, 9);
};

let kitchen_notification = (
  title,
  text,
  image = "",
  sticky = false,
  time = 3000,
  play_sound = false,
  sound_file = 'assets/notify.mp3'
) => {
  // Add notifications to local storage
  let notifications = [];
  if (localStorage.getItem("kitchenNotifications")) {
    notifications = JSON.parse(localStorage.getItem("kitchenNotifications"));
  } else {
    localStorage.setItem("kitchenNotifications", JSON.stringify(notifications));
  }
  let dup = false;
  notifications.forEach(item => {
    if((item.title == title) && (item.text == text) && (moment(item.timestamp, 'MM-DD HH:mm').diff(moment(), 'days') < 1)){
      dup = true;
    }
  })
  if(!dup){
    if (play_sound) {
      let current = new Date().getTime()
      let last_sound_played_time = localStorage.getItem('last_sound_played_time') ? localStorage.getItem('last_sound_played_time') : 0
      if((last_sound_played_time == 0) || ((current - last_sound_played_time) > 10 * 1000)){
        audio = new Audio(sound_file)
        audio.play()
        localStorage.setItem('last_sound_played_time', new Date().getTime())
      }
    }
    notifications.unshift({
      id: generate_id(),
      title: title,
      text: text,
      image: image,
      timestamp: moment().format("MM-DD HH:mm"),
    });
    $.gritter.add({
      title: title,
      text: text,
      image: image,
      sticky: sticky,
      time: time,
      class_name: "my-sticky-class",
      after_close: () => {
        if(play_sound && audio){
          audio.pause()
          audio.currentTime = 0
        }
      }
    });
    localStorage.setItem("kitchenNotifications", JSON.stringify(notifications));
  }
  render_notification();
};

let render_notification = () => {
  let notifications = JSON.parse(localStorage.getItem("kitchenNotifications"));
  $(".kitchen-notifications .notifications").empty();
  if (notifications.length == 0) {
    $(".kitchen-notifications .notification-count").empty();
    $(".kitchen-notifications .notification-count").append(
      $('<i class="fa fa-bell"></i>')
    );
    $(".kitchen-notifications .notifications").append(
      `<div class="dropdown-header">NOTIFICATIONS (0)</div>
      <div class="dropdown-footer text-center">
        <p>There are no notifications right now</p>
      </div>`
    );
  } else {
    $(".kitchen-notifications .notification-count").empty();
    $(".kitchen-notifications .notification-count").append(
      $(`<i class="fa fa-bell"></i><span class="label">${notifications.length}</span>`)
    );
    $(".kitchen-notifications .notifications").append(
      `<div class="dropdown-header" style="position: sticky; top: 0; display: flex; justify-content: space-between;">
        <div>NOTIFICATIONS (${notifications.length})</div>
        <a href="javascript:;" onclick="clear_notifications()" style="font-size: 12px;">&times; Clear all</a>
      </div>`
    );
    notifications.forEach((item) => {
      $(".kitchen-notifications .notifications").append(`
        <a href="javascript:;" class="dropdown-item media">
          <div class="media-left">
            <img src="${item.image}" width="36">
          </div>
          <div class="media-body" style="min-width: 300px">
            <h6 class="media-heading"> ${item.title} </h6>
            <span style="white-space: normal;">${item.text}</span>
            <div class="text-muted f-s-10">${get_elapsed_time_string(
              get_elapsed_hr_min(item.timestamp)
            )} ago</div>
          </div>
        </a>
      `);
    });
  }
};

let clear_notifications = () => {
  localStorage.setItem("kitchenNotifications", JSON.stringify([]));
  render_notification();
};

let save_batch_info = (data) => {
  let batch_info = localStorage.getItem('BATCH_INFORMATION') ? [...JSON.parse(localStorage.getItem('BATCH_INFORMATION'))] : []
  batch_info.push(data)
  localStorage.setItem('BATCH_INFORMATION', JSON.stringify(batch_info))
}

let get_last_batch_number = (item_id) => {
  let batch_info = localStorage.getItem('BATCH_INFORMATION') ? [...JSON.parse(localStorage.getItem('BATCH_INFORMATION'))] : []
  let ret = 0
  let last_timestamp
  batch_info.forEach(item => {
    if(item.item_id == item_id){
      ret = item.batch_number
      last_timestamp = item.timestamp
    }
  })
  if(batch_info.length == 0){
    return 0
  }
  if(Math.abs(moment().diff(moment(last_timestamp), 'days')) >= 1){
    return 0
  }
  return ret
}

let get_batch_number = (batch_item_id) => {
  let batch_info = localStorage.getItem('BATCH_INFORMATION') ? [...JSON.parse(localStorage.getItem('BATCH_INFORMATION'))] : []
  let ret = batch_info.filter(item => item.batch_item_id == batch_item_id)[0]
  if(ret){
    return ret.batch_number
  }else{
    return ''
  }
}
let get_bag_count = (batch_item_id) => {
  let batch_info = localStorage.getItem('BATCH_INFORMATION') ? [...JSON.parse(localStorage.getItem('BATCH_INFORMATION'))] : []
  let ret = batch_info.filter(item => item.batch_item_id == batch_item_id)[0]
  if(ret){
    return ret.bag ? parseFloat(ret.bag) : 1
  }else{
    return 1
  }
}
let clear_batch_info = () => {
  localStorage.removeItem('BATCH_INFORMATION')
}

async function upload_history (data) {
  let res;
  try{
    Pace.restart()
    res = await $.ajax({
      url: API_URL + '/logHistory',
      data: data,
      method: 'post'
    })
    return res;
  }catch(err){
    return err;
  }
}
async function upload_kitchen_item_deduct (data) {
  let res;
  try{
    Pace.restart()
    res = await $.ajax({
      url: API_URL + '/kitchen_item_use',
      data: data,
      method: 'post'
    })
    return res;
  }catch(err){
    return err;
  }
}
async function get_purchasing_item (data) {
  let res;
  try{
    Pace.restart()
    res = await $.ajax({
      url: API_URL + '/kitchen_get_purchasing_item',
      data: data,
      method: 'post'
    })
    return res;
  }catch(err){
    return err;
  }
}
let kitchen_history = (req) => {
  console.log(req)
  upload_history(req).then((res, err) => {
    console.log(res)
  })
}
let get_qty_change = (packing_info, amount) => {
  let res = {
    primary: 0,
    secondary: 0
  }
  if(packing_info.includes(' ') && packing_info.includes('/')){
    let sp_qty = packing_info.split(' ')[1].split('/')[0].replace(/\D/g, "")
    let small_qty = packing_info.split(' ')[0].split('/')[0].replace(/\D/g, "")

    res.secondary = Math.round(amount / small_qty)
    res.primary = Math.floor(res.secondary / sp_qty)
    res.secondary = res.secondary - res.primary * sp_qty
  }
  return res
}
let kitche_item_deduct = (req) => {
  let user = JSON.parse(localStorage.getItem('currentKitchenUser'))
  get_purchasing_item({...req,
    company: user.res[0].company
  }).then((res, err) => {
    let item = JSON.parse(res).res[0]
      upload_kitchen_item_deduct({
        ...req,
        purchasing_item_id: item.id,
        primary_qty_change: get_qty_change(item.packing_info, req.amount).primary,
        secondary_qty_change: get_qty_change(item.packing_info, req.amount).secondary,
        shop_name: user.res[0].shop_name,
        company: user.res[0].company,
        branch_id: user.res[0].branch_id
      }).then((res2, err2) => {
        console.log(res2)
      })
    }
  )
}
let add_disposal_history = (data) => {
  let disposals = localStorage.getItem('DISPOSAL_HISTORY') ? JSON.parse(localStorage.getItem('DISPOSAL_HISTORY')) : []
  disposals.push(data)
  localStorage.setItem('DISPOSAL_HISTORY', JSON.stringify(disposals))
}
let get_disposal_history = (id) => {
  let disposals = localStorage.getItem('DISPOSAL_HISTORY') ? JSON.parse(localStorage.getItem('DISPOSAL_HISTORY')) : []
  return disposals
}
let clear_disposal_history = () => {
  localStorage.removeItem('DISPOSAL_HISTORY')
}


let start_new_day = () => {
  clear_notifications()
  clear_batch_info()
}

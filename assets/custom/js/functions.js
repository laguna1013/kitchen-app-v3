// Functions not related with server data

/*
"id":1,
        "picture":"item_1",
        "name":"Tofu",
        "ingredients":[
            "Eggs",
            "Salt"
        ],
        "recipe":"Ex Lorem excepteur labore fugiat officia. Aliquip commodo voluptate exercitation eu magna. Reprehenderit eiusmod laborum deserunt deserunt. Et ea quis est velit. Labore incididunt magna aliquip laborum deserunt sint labore. Nisi culpa magna aute pariatur aute.\r\n",
        "best_serving_hours":3,
        "safety_level":25,
        "cooking_time":0.5,
        "maximum_amount":2000,
        "cooked_items":[
        ],
        "cooking_items": []

*/
let materials = [];
let notify=[];
// 获得materials的档案，只获取material的内容不获取具体数据
let get_materials= () => {
	$.ajax({
		method:"post",
		url:window.location.origin+"/getMaterials",
		data:{},
		async:false,
		beforeSend: function () {
			
		},
		success:function(data) {
			if(data)
			{
				$returnJson = JSON.parse(data)
				if($returnJson["data"])
				{
					$.each($returnJson["data"],function(){
						$hasMaterial = false;
						$idx = -1;
						// 检查单个material是否存在内存中
						for($i=0;$i<materials.length;$i++)
						{
							if(materials[$i]["id"] == $(this)[0]["id"])
							{
								$idx=$i;
								$hasMaterial=true;
							}
						}
						if(!$hasMaterial)
						{
							// 不存在直接添加
							materials.push($(this)[0]);
							
						}
						else
						{
							// 如果存在修改相应material的内容
							materials[$idx]["code"] = $(this)[0]["code"];
							materials[$idx]["name"] = $(this)[0]["name"];
							materials[$idx]["ingredients"] = $(this)[0]["ingredients"];
							materials[$idx]["recipe"] = $(this)[0]["recipe"];
							materials[$idx]["best_serving_hours"] = $(this)[0]["best_serving_hours"];
							materials[$idx]["safety_level"] = $(this)[0]["safety_level"];
							materials[$idx]["cooking_time"] = $(this)[0]["cooking_time"];
							materials[$idx]["maximum_amount"] = $(this)[0]["maximum_amount"];
							materials[$idx]["advise_dosage"] = $(this)[0]["advise_dosage"];
							materials[$idx]["cooked_items"] = $(this)[0]["cooked_items"];
							materials[$idx]["cooking_items"] = $(this)[0]["cooking_items"];
							materials[$idx]["sellOut"] = $(this)[0]["sellOut"];
						}
					})
				}
			}
		},
		error:function (data) {
			
		},
		complete:function (data) {
			render_item_list()
		}
	})
}

let get_data = () => {
    if(!localStorage.getItem('itemListData')){
		localStorage.setItem('itemListData', JSON.stringify(all_items)); // all_times should be replaced with server data. Located in data.js file.
		return all_items;
	}else{
		return JSON.parse(localStorage.getItem('itemListData'));
	}
}


let get_raw_data = () => {
    // Get item data from local storage. If there is no data in localstorage, it will look up server data.
    if(!localStorage.getItem('rawMaterialData')){
		localStorage.setItem('rawMaterialData', JSON.stringify(raw_materials)); // all_times should be replaced with server data. Located in data.js file.
		return raw_materials;
	}else{
		return JSON.parse(localStorage.getItem('rawMaterialData'));
	}
}
let set_data = (data) => {
    // Set item data to local storage
    localStorage.setItem('itemListData', JSON.stringify(data));
}
let set_raw_data = (data) => {
    // Set item data to local storage
    localStorage.setItem('rawMaterialData', JSON.stringify(data));
}
let get_elapsed_hr_min = (time) => {
	return {
		hr: Math.abs(0),
        min: Math.abs(moment().diff(moment(time, 'MM-DD HH:mm'), 'minutes'))
		
	}
    let hr = Math.trunc(moment().diff(moment(time, 'MM-DD HH:mm'), 'minutes') / 60);
    let min = moment().diff(moment(time, 'MM-DD HH:mm'), 'minutes') % 60;
    if(hr < 0) hr += 24;
    if(min < 0){
        if(hr == 0){
            hr = 23;
        }
        min += 60;
    }
    return {
        hr: Math.abs(hr),
        min: Math.abs(min)
    };
}
let get_elapsed_time_string = (hr_min) => {
    if(hr_min.hr == 0){
        if((hr_min.min == 1) || (hr_min.min == 0)){
            return hr_min.min + ' min';
        }else{
            return hr_min.min + ' mins';
        }
    }else{
        if((hr_min.min == 1) && (hr_min.min == 0)){
            return hr_min.hr + ' hr ' + hr_min.min + ' min';
        }else{
            return hr_min.hr + ' hr ' + hr_min.min + ' mins';
        }
    }
}
let get_time_to_disposal = (bs_hr, cooked_time) => {
	return get_elapsed_time_string({
        hr: 0,
        min: moment(cooked_time, 'MM-DD HH:mm').add(bs_hr, 'minutes').diff(moment(), 'minutes')
    })
    let diff = moment(cooked_time, 'MM-DD HH:mm').add(bs_hr, 'hours').diff(moment(), 'minutes');
    let hr = Math.trunc(diff / 60);
    let min = diff % 60;
    return get_elapsed_time_string({
        hr: hr,
        min: min
    })
}

let generate_id = () => {
    return '_' + Math.random().toString(36).substr(2, 9);
};


let kitchen_notification = (title, text, image = '', sticky = false, time = 3000, play_sound = false) => {
    if(play_sound){

    }
    // Add notifications to local storage
    let notifications = [];
    if(localStorage.getItem('kitchenNotifications')){
        notifications = JSON.parse(localStorage.getItem('kitchenNotifications'));
    }else{
        localStorage.setItem('kitchenNotifications', JSON.stringify(notifications));
    }
    notifications.unshift({
        id: generate_id(),
        title: title,
		text: text,
		image: image,
        timestamp: moment().format('MM-DD HH:mm')
    });
    $.gritter.add({
		title: title,
		text: text,
		image: image,
		sticky: sticky,
		time: time,
		class_name: 'my-sticky-class'
	});
    //localStorage.setItem('kitchenNotifications', JSON.stringify(notifications));
    //render_notification();
}

let render_notification = () => {
    let notifications = notify;
    $('.kitchen-notifications .notifications').empty();
    if(notifications.length == 0){
        $('.kitchen-notifications .notification-count').empty();
        $('.kitchen-notifications .notification-count').append($('<i class="fa fa-bell"></i>'));
    }else{
        $('.kitchen-notifications .notification-count').empty();
        $('.kitchen-notifications .notification-count').append($(`
            <i class="fa fa-bell"></i>
            <span class="label">${ notifications.length }</span>
        `));
        $('.kitchen-notifications .notifications').append(`<div class="dropdown-header">NOTIFICATIONS (${ notifications.length })</div>`);
        notifications.map((item, idx) => {
            if(idx > 10){
                return;
            }
            $('.kitchen-notifications .notifications').append(`
                <a href="javascript:;" class="dropdown-item media">
                    <div class="media-left">
                        <img src="${ item.image }" width="36">
                    </div>
                    <div class="media-body" style="min-width: 300px">
                        <h6 class="media-heading"> ${ item.title } </h6>
                        <span style="white-space: break-spaces;">${ item.text }</span>
                        <div class="text-muted f-s-10">${ get_elapsed_time_string(get_elapsed_hr_min(item.timestamp)) } ago</div>
                    </div>
                </a>
            `);
        })
        $('.kitchen-notifications .notifications').append(`
            <div class="dropdown-footer text-center">
                <a href="javascript:;" onclick="clear_notifications()">Clear all</a>
            </div>
        `);
    }
}

let clear_notifications = () => {
    localStorage.setItem('kitchenNotifications', JSON.stringify([]));
    render_notification();
}


let selected_raw_id = -1;

let render_raw_material = () => {
    let data = get_raw_data();
    let template = `
    <div class="vertical-box-column p-t-15 p-b-15" style="height: 750px; width: 20%;">
        <div class="d-flex flex-column">
            <h5 class="text-center">Total raw materials count: ${ data.length }</h5>
            <div class="raw-material-list" style="height: 680px;">
                <ul>
                    <hr>
                    ${ (() => {
                        let tag = ``;
                        data.map(item => {
                            tag += `
                            <li data-raw-id="${ item.id }">
                                <a href="javascript:;" onclick="select_raw_material('${ item.id }')">
                                    <div class="widget-list widget-list-rounded">
                                        <div class="widget-list-item">
                                            <div class="widget-list-media">
                                                <img src="${ item.image }" class="rounded" />
                                            </div>
                                            <div class="widget-list-content">
                                                <h4 class="widget-list-title">${ item.name }</h4>
                                                <p class="widget-list-desc">Qty: ${ item.qty } g</p>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            <hr>
                            `;
                        })
                        return tag;
                    })() }
                </ul>
            </div>
        </div>
    </div>
    <div class="vertical-box-column p-t-15 p-b-15 raw-material-detail" style="height: 750px; width: 60%;">

    </div>
    <div class="vertical-box-column p-t-15 p-b-15" style="height: 750px; width: 20%;">
        <div class="d-flex flex-column">
            <h5 class="text-center">Add / Disposal history</h5>
            <div class="raw-material-disposal-history" style="height: 640px;">

            </div>
            <div class="text-center m-t-15">
                <button type="button" name="button" class="btn btn-md btn-primary" onclick="upload_disposal_history()">Upload to server</button>
            </div>
        </div>
    </div>
    `;
    $('.item-details').parent().find('.widget-header-title').text('Raw materials');
    $('.item-details').empty();
    $('.item-details').append($(template))
}
let select_raw_material = (raw_id) => {
    selected_raw_id = raw_id;
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    let template = `
        <div class="d-flex flex-row justify-content-between align-items-center p-r-20 p-l-20">
            <h3 class="text-center m-0 text-blue-darker">${ item.name }</h3>
        </div>
        <hr>
        <div class="d-flex flex-row p-20" style="height: 650px;">
            <div class="d-flex flex-column h-100 align-items-center" style="width: 30%;">
                <img src="${ item.image }" class="rounded" alt="" width="200" height="200">
            </div>
            <div class="p-r-20 p-l-20" style="width: 70%;">
                <div class="">
                    <h4>Description</h4>
                    <div class="description f-s-14 m-b-20" contenteditable="true">
                        ${ item.description }
                    </div>
                    <h4>Remaining amount: <span class="text-muted">${ item.qty } g</span></h4>
                </div>
                <div class="d-flex justify-content-end m-t-15">
                    <button type="button" name="button" class="btn btn-lg btn-success m-r-20" onclick="add_raw_qty('${ raw_id }')">Add qty</button>
                    <button type="button" name="button" class="btn btn-lg btn-danger" onclick="dispose_raw('${ raw_id }')">Dispose</button>
                </div>
            </div>
        </div>
    `;
    $('.raw-material-list li').removeClass('active');
    $(`.raw-material-list li[data-raw-id="${ raw_id }"]`).addClass('active');
    $('.raw-material-detail').empty();
    $('.raw-material-detail').append($(template));
    render_history_data(raw_id);
}

let render_history_data = (raw_id) => {
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    let template = `
        <ul>
            <hr>
            ${ (() => {
                let tag = ``;
                item.history.map(history => {
                    tag +=
                        `<li>
                            <div class="widget-list widget-list-rounded">
                                <div class="widget-list-item">
                                    <div class="widget-list-media">
                                        <img src="${ history.image ? history.image : (history.signature ? history.signature : 'assets/img/items/alt.png') }" class="rounded" />
                                    </div>
                                    <div class="widget-list-content">
                                        <h4 class="widget-list-title">
                                            <div class="d-flex justify-content-between">
                                                <span class="label label-${ (history.type == 'add') ? "success" : "danger" } m-r-10">${ (history.type == 'add') ? "Added" : "Disposed" }</span>
                                                ${ history.signature ? '<span class="label label-warning m-r-10">Signed</span>' : '' }
                                            </div>
                                            <div class="m-t-3">${ history.reason ? "Reason: " + history.reason : '' }</div>
                                        </h4>
                                        <div class="d-flex d-row justify-content-between m-t-5">
                                            <p class="widget-list-desc">${ moment(history.timestamp, 'MM-DD HH:mm').format('DD MMM, HH:mm') } ( ${ get_elapsed_time_string(get_elapsed_hr_min(history.timestamp)) } ago )</p>
                                            <p class="widget-list-desc">Qty: ${ history.qty } g </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <hr>`;
                })
                return tag;
            })() }
        </ul>
    `;
    $('.raw-material-disposal-history').empty();
    $('.raw-material-disposal-history').append($(template));
}

let add_raw_qty = (raw_id) => {
    $('#add-raw-modal').modal('show');
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    $('#add-raw-modal .modal-title').text(`You are going to add ${ item.name }`);
    start_draw(0); // Signature drawing

}
let add_raw_qty_confirm = (raw_id) => {
    $('#add-raw-modal').modal('hide');
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    let qty = parseInt($('#add-raw-modal .item_amount').val());
    item.qty += qty;
    item.history.push({
        id: generate_id(),
        type: 'add',
        qty: qty,
        signature: $('#add-raw-modal .signature-image').attr('src'),
        image: $('#add-raw-modal .camera-image').attr('src'),
        timestamp: moment().format('MM-DD HH:mm'),
        reason: ''
    })
    $('#add-raw-modal .item_amount').val('');
    set_raw_data(data);
    render_raw_material();
    select_raw_material(raw_id);
    kitchen_notification("Raw material added!", `You added ${ item.name } ${ qty } g`, 'assets/img/media/info.png', false, 5000);
}
let dispose_raw = (raw_id) => {
    $('#dispose-raw-modal').modal('show');
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    $('#dispose-raw-modal .modal-title').text(`You are going to dispose ${ item.name }`);
    $('#dispose-raw-modal .item_amount').attr('maximum-amount', item.qty);
    $('#dispose-raw-modal .item_amount').attr('placeholder', `Maximum amount: ${ item.qty } g`);
    start_draw(1); // Signature drawing
}
let dispose_raw_confirm = (raw_id) => {
    $('#dispose-raw-modal').modal('hide');
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    let qty = parseInt($('#dispose-raw-modal .item_amount').val());
    item.qty -= qty;
    item.history.push({
        id: generate_id(),
        type: 'dispose',
        qty: qty,
        signature: $('#dispose-raw-modal .signature-image').attr('src'),
        image: $('#dispose-raw-modal .camera-image').attr('src'),
        timestamp: moment().format('MM-DD HH:mm'),
        reason: $('#dispose-raw-modal input[name="disposal_reason"]:checked').val()
    })
    $('#dispose-raw-modal .item_amount').val('');
    set_raw_data(data);
    render_raw_material();
    select_raw_material(raw_id);
    kitchen_notification("Raw material disposed!", `You disposed ${ item.name } ${ qty } g, Reason: ${ $('#dispose-raw-modal input[name="disposal_reason"]:checked').val() }`, 'assets/img/media/info.png', false, 5000);
}

let key_tap_add_raw = (key) => {
    let val = $('#add-raw-modal .item_amount').val();
    if(key == '-1'){
        val = val.slice(0, -1);
    }else if(key == '-2'){
        val = '';
    }else{
        val += key;
    }
    if((val.length != 1) && (val[0] == '0')){
        val = val.slice(1);
    }
    if(val == ''){
        val = 0;
    }
    $('#add-raw-modal .item_amount').val(val);
}
let key_tap_dispose_raw = (key) => {
    let val = $('#dispose-raw-modal .item_amount').val();
    let max = $('#dispose-raw-modal .item_amount').attr('maximum-amount');
    if(key == '-1'){
        val = val.slice(0, -1);
    }else if(key == '-2'){
        val = '';
    }else{
        val += key;
    }
    if((val.length != 1) && (val[0] == '0')){
        val = val.slice(1);
    }
    if(val == ''){
        val = 0;
    }
    $('#dispose-raw-modal .item_amount').val(val);
    if(parseInt(val) <= parseInt(max)){
        $('#dispose-raw-modal .item_amount').removeClass('text-red');
        $('#dispose-raw-modal .item_percent').text(`After disposal there will be ${ parseInt(max) - parseInt(val) } g left.`);
    }else{
        $('#dispose-raw-modal .item_amount').addClass('text-red');
        $('#dispose-raw-modal .item_percent').text(`Invalid amount. You need to input smaller than maximum amount.(${ max }g)`);
    }
}

let upload_disposal_history = (id) => {
    let data = get_raw_data();
    let item = [...data.filter(item => item.id == raw_id)][0];
    // Upload data to server here
    item.history = [];
    set_raw_data(data);
    render_raw_material();
    select_raw_material(raw_id);
    kitchen_notification("Uploaded to server!", `You uploaded raw materials history data to the server.`, 'assets/img/media/info.png', false, 5000);
}
$('.raw-material').click(function(){
    selected_item_id = -1;
    $('.item').removeClass('active');
    $(this).addClass('active');

    render_raw_material();
})

$('.confirm_add_raw').click(function(){
    add_raw_qty_confirm(selected_raw_id);
})
$('.confirm_dispose_raw').click(function(){
    dispose_raw_confirm(selected_raw_id);
})
$(document).ready(function(){
})

/* 
  Copyright © 2018 danyadev

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/* Контактные данные:
   vk: https://vk.com/danyadev
   telegram: https://t.me/danyadev
   email: nemov.danil@mail.ru
   github: https://github.com/danyadev/vk-desktop-app
*/

'use strict';

const { BrowserWindow } = require('electron').remote;
const fs = require('fs');
const https = require('https');
const SETTINGS_PATH = require('./utils').SETTINGS_PATH;

danyadev.audio = {};

var audio = document.querySelector('.audio'),
    audiolist = document.querySelector('.audiolist'),
    audioplayer = document.querySelector('.audioplayer'),
    content = document.querySelector('.content'),
    player_cover = document.querySelector('.player_cover'),
    player_btn = document.querySelector('.player_btn'),
    player_back = document.querySelectorAll('.player_button')[0],
    player_next = document.querySelectorAll('.player_button')[1],
    player_author = document.querySelector('.player_author'),
    player_name = document.querySelector('.player_name'),
    player_progress_loaded = document.querySelector('.player_progress_loaded'),
    player_progress_all = document.querySelector('.player_progress_all'),
    player_progress_played = document.querySelector('.player_progress_played'),
    player_progress_wrap = document.querySelector('.player_progress_wrap'),
    player_volume_wrap = document.querySelector('.player_volume_wrap'),
    player_util_volume_this = document.querySelector('.player_util_volume_this'),
    settings_json = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    
player_util_volume_this.style.width = settings_json.audio.volume * 100 + '%';
danyadev.audio.audioLoaded = 0, danyadev.audio.this_track_id = 0;

var load = (user, offset) => {
  danyadev.user = user;
  
  vkapi.method('audio.get', {
    offset: offset || 0,
    count: 15
  }, data => {
    danyadev.audio.count = data.response.count;
    data = data.response;
    let item_id = 0;
    
    let renderAudioItem = () => {
      let item = data.items[item_id];
      if(!item) return;
      
      let cover, downloadClass,
          minutes = Math.floor(item.duration / 60),
          hours = minutes >= 60 ? Math.floor(minutes / 60) + ':' : '',
          secondsZero = (item.duration % 60) < 10 ? '0' : '',
          seconds = ':' + secondsZero + item.duration % 60;
      
      if(hours != '') {
        let minutesZero = (minutes - parseInt(hours) * 60) < 10 ? '0' : '';
        minutes = minutesZero + (minutes - parseInt(hours) * 60);
      }
      
      let time = hours + minutes + seconds;
      
      if(item.album && item.album.thumb) cover = item.album.thumb.photo_68;
      else cover = 'https://vk.com/images/audio_row_placeholder.png';
      
      if(fs.existsSync(danyadev.user.downloadPath + '\\' + item.artist + ' – ' + item.title + '.mp3'))
        downloadClass = 'audio_downloaded'
      else downloadClass = 'audio_download';
      
      audiolist.innerHTML += `
        <div class='audio_item' src='${item.url}' onclick='audio.toggleAudio(this, event)'>
          <div class='audio_covers'>
            <div class='audio_cover' style='background-image: url("${cover}")'></div>
            <div class='audio_cover_play'></div>
          </div>
          <div class='audio_names'>
            <div class='audio_name'>${item.title}</div>
            <div class='audio_author'>${item.artist}</div>
          </div>
          <div class='audio_right_btns'>
            <!--<div class='${downloadClass}' title='Скачать аудиозапись' onclick='audio.downloadAudio(this)'
                 data='["${item.artist}", "${item.title}", "${item.url}"]'></div>-->
            <div></div>
            <div class='audio_real_time' onclick='audio.toggleTime(this, event, "real")'>${time}</div>
            <div class='audio_played_time' onclick='audio.toggleTime(this, event, "played")'></div>
          </div>
        </div>
      `.trim();
      
      item_id++;
      if(item_id < data.items.length) setTimeout(renderAudioItem, 0);
      else getMoreSound(user, offset, data);
    }
    
    renderAudioItem();
  });
}

var toggleAudio = (track, event) => {
  if(!track || (event && event.target != track.children[0].children[1])) return;
  
  audio.audio_item = track;
  danyadev.audio.this_track_id = [].slice.call(audiolist.children).indexOf(track);
  
  let audio_item_active = document.querySelector('.audio_item_active'),
      audio_cover_stop = document.querySelector('.audio_cover_stop');
  
  if(audio_cover_stop) {
    audio_cover_stop.classList.add('audio_cover_play');
    audio_cover_stop.classList.remove('audio_cover_stop');
  }
    
  let audio_item = track, cover_util = track.children[0].children[1];
    
  if(audio.src != track.attributes.src.value) { // если другой трек
    audio.src = track.attributes.src.value;
    
    if(document.querySelector('.audio_cover_has_play'))
      document.querySelector('.audio_cover_has_play').classList.remove('audio_cover_has_play');
      
    cover_util.classList.add('audio_cover_has_play');
    
    if(audio_item_active) audio_item_active.classList.remove('audio_item_active');
    
    if(document.querySelector('.hidden_time')) {
      document.querySelector('.hidden_time').style.display = '';
      document.querySelector('.hidden_time').classList.remove('hidden_time');
      
      document.querySelector('.showed_time').innerHTML = '';
      document.querySelector('.showed_time').classList.remove('showed_time');
    }
    
    if(track.children[0].children[0].style.backgroundImage != 'url("https://vk.com/images/audio_row_placeholder.png")')
      player_cover.style.backgroundImage = track.children[0].children[0].style.backgroundImage;
    else player_cover.style.backgroundImage = 'url("images/empty_cover.svg")';
    
    player_name.innerHTML = '<span class=\'player_author\'>'
                          + audio.audio_item.children[1].children[1].innerHTML
                          + '</span> – '
                          + audio.audio_item.children[1].children[0].innerHTML;
  }
  
  if(audio.paused) {
    cover_util.classList.add('audio_cover_stop');
    cover_util.classList.remove('audio_cover_play');
    audio_item.classList.add('audio_item_active');
    
    if(document.querySelector('.player_play')) {
      document.querySelector('.player_play').classList.add('player_pause');
      document.querySelector('.player_play').classList.remove('player_play');
    } else {
      player_progress_loaded.style.width = '';
      player_progress_played.style.width = '';
    }
    
    audio.play();
  } else {
    cover_util.classList.add('audio_cover_play');
    cover_util.classList.remove('audio_cover_stop');
    document.querySelector('.player_pause').classList.add('player_play');
    document.querySelector('.player_pause').classList.remove('player_pause');
    
    audio.pause();
  }
}

var downloadAudio = (block) => {
  let data = JSON.parse(block.attributes.data.value),
      author = data[0], name = data[1], url = data[2];
  
  if(block.classList.contains('audio_downloaded')) return;
  
  setTimeout(() => {
    let file_name = author + ' – ' + name + '.mp3',
        file = fs.createWriteStream(danyadev.user.downloadPath + '\\' + file_name);
  
    https.get(url, res => {
      res.on('data', data => file.write(data));
      res.on('end', () => {
        file.end();
        block.classList.add('audio_downloaded');
        block.classList.remove('audio_download');
      });
    });
  }, 0);
}

var getMoreSound = (user, offset, data) => {
  let forListen = () => {
    if(audiolist.clientHeight && audiolist.clientHeight - window.outerHeight < content.scrollTop) {
      content.removeEventListener('scroll', forListen);
      if(offset) {
        if(offset < data.count) {
          offset += 15;
          danyadev.audio.offset = offset;
          load(user, offset);
        }
      } else load(user, 15);
    }
  }
  
  content.addEventListener('scroll', forListen);
  
  if(!audio.audio_item) { // при первой загрузке
    audio.audio_item = audiolist.children[0];
    audio.src = audio.audio_item.attributes.src.value;
    audio.audio_item.children[0].children[1].classList.add('audio_cover_has_play');
    if(audio.audio_item.children[0].children[0].style.backgroundImage != 'url("https://vk.com/images/audio_row_placeholder.png")')
      player_cover.style.backgroundImage = audio.audio_item.children[0].children[0].style.backgroundImage;
    else player_cover.style.backgroundImage = 'url("images/empty_cover.svg")';
    
    player_name.innerHTML = '<span class=\'player_author\'>'
                          + audio.audio_item.children[1].children[1].innerHTML
                          + '</span> – '
                          + audio.audio_item.children[1].children[0].innerHTML;
  }
  
  if(!danyadev.audio.audioLoaded && audiolist.clientHeight - window.outerHeight < window.scrollY) {
    forListen();
  } else if(!danyadev.audio.audioLoaded) {
    danyadev.audio.audioLoaded = 1;
    // загружаем сюда всю музыку юзера для shuffle(tracklist);
  }
}

var matchPlayedTime = () => {
  if(audio.paused) return;
  
  let time = audio.currentTime,
      zero = time % 60 < 10 ? '0' : '',
      audio_real_time = audio.audio_item.children[2].children[1],
      audio_played_time = audio.audio_item.children[2].children[2];
      
  if(!audio_real_time.showreal) audio_real_time.style.display = 'none';
  if(!audio_real_time.classList.contains('showed_time')) audio_real_time.classList.add('hidden_time');
  if(!audio_played_time.classList.contains('hidden_time')) audio_played_time.classList.add('showed_time');
  audio_played_time.innerHTML = Math.floor(time / 60) + ':' + zero + Math.floor(time % 60);
  
  setTimeout(matchPlayedTime, 250);
}

audio.addEventListener('play', matchPlayedTime);

var toggleTime = (elem, event, type) => {
  let item = event.path[2],
      real = item.children[2].children[1],
      played = item.children[2].children[2];
      
  if(type == 'real' && played.innerHTML != '') {
    real.style.display = 'none';
    real.showreal = 0;
    played.style.display = 'block';
  } else {
    real.showreal = 1;
    real.style.display = 'block';
    played.style.display = 'none';
  }
}

player_back.addEventListener('click', () => {
  let audioItem = audiolist.children[danyadev.audio.this_track_id - 1];
  
  if(!audioItem && !audio.paused) toggleAudio(audiolist.children[0]);
  else if(!audioItem) return;
  else toggleAudio(audioItem);
});

player_next.addEventListener('click', () => {
  let audioTrack = audiolist.children[danyadev.audio.this_track_id + 1];
  
  if(!audioTrack) audioTrack = audiolist.children[0];
  
  toggleAudio(audioTrack);
});

player_btn.addEventListener('click', () => {
  let audioItem = audiolist.children[danyadev.audio.this_track_id];
  
  if(!audioItem) audioItem = audiolist.children[0];
  
  toggleAudio(audioItem);
});

audio.addEventListener('ended', () => { // переключение на следующее аудио
  audio.audio_item.children[0].children[1].classList.add('audio_cover_play');
  audio.audio_item.children[0].children[1].classList.remove('audio_cover_stop');
  audio.audio_item.classList.remove('audio_item_active');
  
  let audioItem = audiolist.children[danyadev.audio.this_track_id + 1];
  if(!audioItem) audioItem = audiolist.children[0];
  
  setTimeout(() => toggleAudio(audioItem), 400);
});

content.addEventListener('scroll', () => {
  if(content.scrollTop >= 56) { // 100 - 44, где 44 - высота шапки
    audioplayer.style.position = 'fixed';
    audioplayer.style.marginTop = '44px';
    document.querySelector('.pl50').style.display = 'block';
  } else {
    audioplayer.style.position = '';
    audioplayer.style.marginTop = '';
    document.querySelector('.pl50').style.display = 'none';
  }
});

audio.addEventListener('progress', () => { // сколько прогружено
  if(audio.buffered.length > 0) {
    player_progress_loaded.style.width = audio.buffered.end(0) / audio.duration * 100 + '%';
  }
});

audio.addEventListener('timeupdate', () => { // сколько проиграно
  if(!danyadev.audio.seekstate)
    player_progress_played.style.width = (audio.currentTime / audio.duration) * 100 + '%';
});

// прокрутка трека
player_progress_wrap.addEventListener('mousedown', () => {
  if(!audio.duration) return; // нет времени -> нет трека -> выходим отсюда
  danyadev.audio.seekstate = 1;
  player_progress_wrap.classList.add('player_progress_active');
  
  let mousemove = e => {
    let offsetx = e.pageX - player_progress_wrap.offsetLeft,
        curTime = offsetx / player_progress_wrap.offsetWidth, selWidth = curTime * 100;
        
    if(selWidth > 100) selWidth = 100;
    if(selWidth < 0) selWidth = 0;
    player_progress_played.style.width = selWidth + '%';
  }
  
  let mouseup = e => {
    danyadev.audio.seekstate = 0;
    player_progress_wrap.classList.remove('player_progress_active');
    
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
    
    let offsetx = e.pageX - player_progress_wrap.offsetLeft;
    audio.currentTime = (offsetx * audio.duration) / player_progress_wrap.offsetWidth;
  }
  
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
});

// громкость
player_volume_wrap.addEventListener('mousedown', e => {
  player_volume_wrap.classList.add('player_volume_active');
  
  let offsetx = e.pageX - player_volume_wrap.offsetLeft,
      curTime = offsetx / player_volume_wrap.offsetWidth, selWidth = curTime * 100,
      volume = offsetx / player_volume_wrap.offsetWidth;
  
  volume < 0 ? volume = 0 : '';
  volume > 1 ? volume = 1 : '';
  
  if(selWidth > 100) selWidth = 100;
  if(selWidth < 0) selWidth = 0;
  
  audio.volume = volume;
  player_util_volume_this.style.width = selWidth + '%';
  
  let mousemove = e => {
    if(e.buttons != 1) return;
    
    let volume = offsetx / player_volume_wrap.offsetWidth;
        offsetx = e.pageX - player_volume_wrap.offsetLeft;
        curTime = offsetx / player_volume_wrap.offsetWidth, selWidth = curTime * 100;
    
    volume < 0 ? volume = 0 : '';
    volume > 1 ? volume = 1 : '';
    
    if(selWidth > 100) selWidth = 100;
    if(selWidth < 0) selWidth = 0;
    
    audio.volume = volume;
    player_util_volume_this.style.width = selWidth + '%'
  }
  
  let mouseup = e => {
    player_volume_wrap.classList.remove('player_volume_active');
    
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  }
  
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mouseup', mouseup);
});

var shuffle = playlist => { // --i - уменьшение i, и пока он больше нуля,
	for( // т.е. если не прошел по всему плейлисту, он продолжает идти
    let j, x, i = playlist.length; i;
    j = Math.floor(Math.random() * i), 
    x = playlist[--i], 
    playlist[i] = playlist[j], 
    playlist[j] = x
  );
};


module.exports = {
  init, load,
  toggleAudio,
  toggleTime,
  downloadAudio,
  shuffle
}
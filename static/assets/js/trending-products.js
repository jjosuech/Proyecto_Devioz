
(function(){
  function starIcons(rating){
    var html='';
    for (var i=1;i<=5;i++){
      html += (i<=rating) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return html;
  }

  function productCard(p){
    var badgeHtml = '';
    if(p.badge && p.badge.type && p.badge.label){
      badgeHtml = '<span class="type '+p.badge.type+'">'+p.badge.label+'</span>';
    }
    var compareHtml = (p.compareAt && p.compareAt>p.price) ? '<del>$'+Number(p.compareAt).toFixed(2)+'</del>' : '';
    return [
      '<div class="product-item">',
        '<div class="product-img">',
          badgeHtml,
          //'<a href="'+(p.url||'#')+'"><img alt="" src="'+p.image+'" /></a>',
          '<a href="/product/'+p.id+'"><img alt="" src="'+p.image+'" /></a>',
          '<div class="product-action-wrap">',
            '<div class="product-action">',
              '<a data-bs-target="#quickview" data-bs-toggle="modal" data-tooltip="tooltip" href="#" title="Quick View"><i class="far fa-eye"></i></a>',
              '<a data-tooltip="tooltip" href="#" title="Add To Wishlist"><i class="far fa-heart"></i></a>',
              '<a data-tooltip="tooltip" href="#" title="Add To Compare"><i class="far fa-arrows-repeat"></i></a>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="product-content">',
          '<h3 class="product-title"><a href="'+(p.url||'#')+'">'+p.title+'</a></h3>',
          '<div class="product-rate">'+starIcons(p.rating||0)+'</div>',
          '<div class="product-bottom">',
            '<div class="product-price">'+compareHtml+'<span>$'+Number(p.price).toFixed(2)+'</span></div>',
            '<button class="product-cart-btn" data-bs-placement="left" data-tooltip="tooltip" title="Add To Cart" type="button"><i class="far fa-shopping-bag"></i></button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }

  function initSlider($slider){
    try{
      if($slider.hasClass('owl-loaded')){
        $slider.trigger('destroy.owl.carousel');
        $slider.removeClass('owl-loaded');
        $slider.find('.owl-stage-outer').children().unwrap();
      }
      $slider.owlCarousel({
        loop:true,
        margin:24,
        nav:true,
        dots:false,
        autoplay:true,
        autoplayTimeout:4000,
        autoplayHoverPause:true,
        navText:['<i class="far fa-angle-left"></i>','<i class="far fa-angle-right"></i>'],
        responsive:{
          0:{items:1},
          576:{items:2},
          768:{items:3},
          992:{items:4}
        }
      });
    }catch(e){
      console.warn('Owl init error', e);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    var slider = document.querySelector('.product-area .product-slider.owl-carousel');
    if(!slider) return;
    fetch('/static/assets/data/products.json', {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(items){
        slider.innerHTML = items.map(productCard).join('');
        if (window.jQuery && jQuery.fn.owlCarousel){
          initSlider(jQuery(slider));
        }
      })
      .catch(function(err){
        console.error('No se pudieron cargar productos.json', err);
      });
  });
})();

<template>
  <footer class="footer px-4">
    <div class="row align-items-center justify-content-lg-between">
      <div class="col-lg-6">
        <div class="copyright text-center text-lg-left text-muted">
          © {{ year }}
          <a
            href="https://chest.store"
            class=" text-primary font-weight-bold ml-1"
            target="_blank"
            ><img
              style="max-width: 30px"
              class="img-fluid"
              src="/public/img/brand/cheststore-black-full.png"
          /></a>
        </div>
      </div>
      <div class="col-lg-6">
        <!-- <ul class="nav nav-footer justify-content-center justify-content-lg-end">
          <li class="nav-item">
            <a href="https://www.creative-tim.com" class="nav-link" target="_blank">Creative Tim</a>
          </li>
          <li class="nav-item">
            <a href="https://www.creative-tim.com/presentation" class="nav-link" target="_blank">About Us</a>
          </li>
          <li class="nav-item">
            <a href="http://blog.creative-tim.com" class="nav-link" target="_blank">Blog</a>
          </li>
          <li class="nav-item">
            <a href="https://www.creative-tim.com/license" class="nav-link" target="_blank">License</a>
          </li>
        </ul> -->
        <ul
          class="nav nav-footer justify-content-center justify-content-xl-end"
        >
          <li class="nav-item">
            <a href="https://chest.store" class="nav-link" target="_blank"
              >chest.store</a
            >
          </li>
          <li class="nav-item">
            <a
              href="https://github.com/cheststore/chest.store"
              class="nav-link"
              target="_blank"
              ><i class="fab fa-github"></i
            ></a>
          </li>
          <!-- <li class="nav-item">
                            <a href="http://blog.creative-tim.com" class="nav-link" target="_blank">Blog</a>
                        </li> -->
        </ul>
      </div>
    </div>
  </footer>
</template>
<script>
  export default {
    data() {
      return {
        year: new Date().getFullYear(),
      }
    },
  }
</script>
<style></style>
